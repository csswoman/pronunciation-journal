import { fetchCoreWordsForDay } from '@/lib/core-1000/client-fetch'
import { db } from '@/lib/db'
import {
  getAllSounds,
  getSessionDataset,
  getSessionDatasets,
} from '@/lib/phoneme-practice/queries'
import { deckSlugForWeakTopics } from '@/lib/practice/topic-decks'
import { buildFailedSentencesMixStep } from '@/lib/review/build-failed-exercises'
import {
  fetchRecentFailedSentences,
} from '@/lib/review/client-queries'
import { mergeReviewWords } from '@/lib/review/merge-words'
import { dominantTopicLabel } from '@/lib/practice/topic-labels'
import type { DailyPlan, DailyStep, SessionArc } from '@/lib/practice/types'
import type { Sound } from '@/lib/phoneme-practice/types'
import { buildConnectedSpeechStep, buildSentenceBuilderStep } from './async-step-builders'
import { DAILY_PLAN_STEP_COUNT, WORD_REVIEW_WORD_COUNT } from './constants'
import {
  fetchAllPracticedSounds,
  fetchDueReviewWords,
  fetchDueSounds,
  fetchDueWords,
  fetchNewWords,
  fetchWeakWords,
  fetchWeakestSoundProgress,
} from './fetchers'
import { dayOfYear, pickSeedSound } from './selectors'
import { biasWordsBySound } from './sound-word-bridge'
import {
  buildContextPracticeStep,
  buildListeningStep,
  buildMinimalPairsStep,
  buildPhonemeFocusStep,
  buildWordIntroStep,
  buildWordReviewStep,
} from './step-builders'

export type ReviewPlan = {
  steps: DailyStep[]
  totalExercises: number
  /** true si no hay nada pendiente de repasar hoy. */
  nothingDue: boolean
}

export async function buildReviewPlan(userId: string): Promise<ReviewPlan> {
  const reviewContext = 'review' as const

  const [failedItems, weakWords, reviewWords, dueSounds] = await Promise.all([
    fetchRecentFailedSentences(userId, 5),
    fetchWeakWords(userId, WORD_REVIEW_WORD_COUNT),
    fetchDueReviewWords(userId, WORD_REVIEW_WORD_COUNT),
    fetchDueSounds(userId),
  ])

  const mergedWords = mergeReviewWords(weakWords, reviewWords, WORD_REVIEW_WORD_COUNT)

  const steps: DailyStep[] = []

  const failedStep = await buildFailedSentencesMixStep(failedItems, reviewContext)
  if (failedStep) steps.push(failedStep)

  const wordStep = buildWordReviewStep(mergedWords, reviewContext)
  if (wordStep) steps.push(wordStep)

  const contextStep = buildContextPracticeStep(mergedWords, reviewContext)
  if (contextStep) steps.push(contextStep)

  // Sounds: use due sounds when available, fall back to all practiced sounds.
  const soundsToReview = dueSounds.length > 0 ? dueSounds : await fetchAllPracticedSounds(userId, 4)
  const reviewDatasets = await getSessionDatasets(soundsToReview.map((sound) => sound.id))

  for (const sound of soundsToReview) {
    const dataset = reviewDatasets.get(sound.id)
    if (!dataset) continue

    const { targetSound, sounds, wordsBySoundId, minimalPairs } = dataset
    const targetWords = wordsBySoundId.get(targetSound.id) ?? []
    const focus = buildPhonemeFocusStep(
      targetSound,
      targetWords,
      sounds,
      wordsBySoundId,
      minimalPairs,
      true,
      reviewContext,
    )
    if (focus) steps.push({ ...focus, id: `review_sound:${targetSound.id}`, kind: 'phoneme_focus' })
  }

  const totalExercises = steps.reduce((sum, s) => sum + s.exercises.length, 0)

  return {
    steps,
    totalExercises,
    nothingDue: steps.length === 0,
  }
}

export async function buildDailyPlan(userId: string): Promise<DailyPlan> {
  const allSounds = await getAllSounds()

  let reviewWords = await fetchNewWords(userId, WORD_REVIEW_WORD_COUNT)
  if (reviewWords.length < WORD_REVIEW_WORD_COUNT) {
    const newIds = new Set(reviewWords.map((w) => w.id))
    const due = (await fetchDueWords(userId, WORD_REVIEW_WORD_COUNT)).filter((w) => !newIds.has(w.id))
    reviewWords = [...reviewWords, ...due].slice(0, WORD_REVIEW_WORD_COUNT)
  }
  const hasWordBank = reviewWords.length > 0

  if (reviewWords.length === 0) {
    reviewWords = await fetchCoreWordsForDay(dayOfYear(), WORD_REVIEW_WORD_COUNT)
  }

  const [weakest, localLearningState] = await Promise.all([
    fetchWeakestSoundProgress(userId),
    db.learningState.get(userId).catch(() => null),
  ])
  const aiState = localLearningState?.state ?? null
  const hasProgress = weakest != null

  let primarySound: Sound | null = weakest
  if (!primarySound && aiState) {
    const worstSound = [...(aiState.pronunciation.strugglingSounds ?? [])]
      .filter((s) => s.attempts >= 3 && s.avgAccuracy < 70)
      .sort((a, b) => a.avgAccuracy - b.avgAccuracy)[0]
    if (worstSound) {
      primarySound = allSounds.find((s) => s.ipa === worstSound.ipa) ?? null
    }
  }
  if (!primarySound) primarySound = pickSeedSound(allSounds, 0)

  // Puente fonema ↔ vocabulario: sesga las palabras del word_bank hacia el sonido
  // débil del día. Solo sobre vocabulario propio (no Core-1000 fallback).
  if (primarySound && hasWordBank) {
    reviewWords = biasWordsBySound(reviewWords, primarySound.ipa, WORD_REVIEW_WORD_COUNT)
  }

  // New/challenging content first, review last.
  const newSteps: DailyStep[] = []
  const reviewSteps: DailyStep[] = []

  if (primarySound) {
    const { sounds, wordsBySoundId, minimalPairs } = await getSessionDataset(primarySound.id)
    const targetWords = wordsBySoundId.get(primarySound.id) ?? []

    const focus = buildPhonemeFocusStep(
      primarySound,
      targetWords,
      sounds,
      wordsBySoundId,
      minimalPairs,
      hasProgress,
    )
    if (focus) newSteps.push(focus)

    const minimal = buildMinimalPairsStep(primarySound, minimalPairs)
    if (minimal) newSteps.push(minimal)

    const listening = buildListeningStep(primarySound, targetWords)
    if (listening) newSteps.push(listening)
  }

  const weakTopics = aiState?.grammar.weakTopics ?? []
  const weakDeckSlug = deckSlugForWeakTopics(weakTopics)
  const weakTopic = weakTopics.find((t) => t.errorRate > 0.4 && t.sampleCount >= 3)?.topic
  const sentenceSource = weakDeckSlug ?? (dayOfYear() % 2 === 0 ? 'lesson' : 'grammar-deck')

  const allSteps = [...newSteps]

  if (allSteps.length < DAILY_PLAN_STEP_COUNT) {
    const connectedStep = await buildConnectedSpeechStep()
    if (connectedStep) {
      allSteps.push(connectedStep)
    } else {
      const sentenceStep = await buildSentenceBuilderStep(sentenceSource, weakTopic)
      if (sentenceStep) allSteps.push(sentenceStep)
    }
  }

  if (allSteps.length < DAILY_PLAN_STEP_COUNT) {
    const sentenceStep = await buildSentenceBuilderStep(sentenceSource, weakTopic)
    if (sentenceStep) allSteps.push(sentenceStep)
  }

  // Noticing before testing: present new words before they appear in word_review.
  const wordIntro = buildWordIntroStep(reviewWords)
  if (wordIntro) reviewSteps.push(wordIntro)

  const wordReview = buildWordReviewStep(reviewWords)
  if (wordReview) reviewSteps.push(wordReview)

  const contextPractice = buildContextPracticeStep(reviewWords)
  if (contextPractice) reviewSteps.push(contextPractice)

  let steps: DailyStep[] = [...allSteps, ...reviewSteps]

  // When SRS items are due, prepend top review-hub steps so the daily plan surfaces them first.
  const hasDueSrs =
    (await fetchDueReviewWords(userId, 1)).length > 0 ||
    (await fetchDueSounds(userId)).length > 0

  if (hasDueSrs) {
    const hubPlan = await buildReviewPlan(userId)
    const hubPriority = hubPlan.steps.slice(0, 2)
    const usedIds = new Set(steps.map((s) => s.id))
    const toPrepend = hubPriority.filter((s) => !usedIds.has(s.id))
    steps = [...toPrepend, ...steps]
  }

  let offset = 1
  const usedIds = new Set(steps.map((s) => s.id))
  const fallbackSounds: Sound[] = []
  while (steps.length < DAILY_PLAN_STEP_COUNT && offset <= allSounds.length) {
    const sound = pickSeedSound(allSounds, offset, primarySound?.id)
    offset++
    if (!sound) break
    fallbackSounds.push(sound)
  }

  if (fallbackSounds.length > 0) {
    const fallbackDatasets = await getSessionDatasets(fallbackSounds.map((sound) => sound.id))

    for (const sound of fallbackSounds) {
      if (steps.length >= DAILY_PLAN_STEP_COUNT) break
      const dataset = fallbackDatasets.get(sound.id)
      if (!dataset) continue

      const { targetSound, sounds, wordsBySoundId, minimalPairs } = dataset

      const words = wordsBySoundId.get(targetSound.id) ?? []
      if (words.length === 0) continue

      const focus = buildPhonemeFocusStep(
        targetSound,
        words,
        sounds,
        wordsBySoundId,
        minimalPairs,
        false,
      )
      if (focus && !usedIds.has(focus.id)) {
        steps.push(focus)
        usedIds.add(focus.id)
      }
    }
  }

  const finalSteps = steps.slice(0, DAILY_PLAN_STEP_COUNT)

  // Session arc: narrative framing reusing data the plan already computed.
  // Topics live on generic exercise payloads (payload.data.topic).
  const arcTopics = finalSteps.flatMap((s) =>
    s.exercises.map((e) => (e.payload.kind === 'generic' ? e.payload.data.topic : undefined)),
  )
  // Session words come from the day's review words (authoritative, readable text).
  const sessionWords = Array.from(
    new Set(reviewWords.map((w) => w.text).filter((t): t is string => !!t)),
  )
  const arc: SessionArc = {
    topicLabel: dominantTopicLabel(arcTopics),
    soundIpa: primarySound?.ipa ?? null,
    sessionWords,
  }

  const totalExercises = finalSteps.reduce((sum, s) => sum + s.exercises.length, 0)

  return {
    steps: finalSteps,
    totalExercises,
    isNewUser: !hasWordBank && !hasProgress,
    arc,
  }
}
