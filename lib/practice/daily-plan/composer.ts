import { fetchCoreWordsForDay } from '@/lib/core-1000/client-fetch'
import { db } from '@/lib/db'
import { getAllSounds, getAllWords, getMinimalPairs, getWordsBySound } from '@/lib/phoneme-practice/queries'
import { deckSlugForWeakTopics } from '@/lib/practice/topic-decks'
import type { DailyPlan, DailyStep } from '@/lib/practice/types'
import type { Sound, SoundWord } from '@/lib/phoneme-practice/types'
import { buildConnectedSpeechStep, buildSentenceBuilderStep } from './async-step-builders'
import { DAILY_PLAN_STEP_COUNT, WORD_REVIEW_WORD_COUNT } from './constants'
import {
  fetchDueReviewWords,
  fetchDueSounds,
  fetchDueWords,
  fetchNewWords,
  fetchWeakestSoundProgress,
} from './fetchers'
import { dayOfYear, pickSeedSound } from './selectors'
import {
  buildContextPracticeStep,
  buildListeningStep,
  buildMinimalPairsStep,
  buildPhonemeFocusStep,
  buildWordReviewStep,
} from './step-builders'

export type ReviewPlan = {
  steps: DailyStep[]
  totalExercises: number
  /** true si no hay nada pendiente de repasar hoy. */
  nothingDue: boolean
}

export async function buildReviewPlan(userId: string): Promise<ReviewPlan> {
  const [reviewWords, dueSounds, allSounds, allWords] = await Promise.all([
    fetchDueReviewWords(userId, WORD_REVIEW_WORD_COUNT),
    fetchDueSounds(userId),
    getAllSounds(),
    getAllWords(),
  ])

  const allWordsBySoundId = new Map<number, SoundWord[]>(
    allSounds.map((s) => [s.id, allWords.filter((w) => w.sound_id === s.id)]),
  )

  const steps: DailyStep[] = []

  const wordStep = buildWordReviewStep(reviewWords)
  if (wordStep) steps.push(wordStep)

  const contextStep = buildContextPracticeStep(reviewWords)
  if (contextStep) steps.push(contextStep)

  for (const sound of dueSounds) {
    const targetWords = allWordsBySoundId.get(sound.id) ?? []
    const pairs = await getMinimalPairs(sound.id)

    const focus = buildPhonemeFocusStep(sound, targetWords, allSounds, allWordsBySoundId, pairs, true)
    if (focus) steps.push({ ...focus, id: `review_sound:${sound.id}`, kind: 'phoneme_focus' })
  }

  const sentenceStep = await buildSentenceBuilderStep(null)
  if (sentenceStep) steps.push(sentenceStep)

  const totalExercises = steps.reduce((sum, s) => sum + s.exercises.length, 0)

  return {
    steps,
    totalExercises,
    nothingDue: steps.length === 0,
  }
}

export async function buildDailyPlan(userId: string): Promise<DailyPlan> {
  const [allSounds, allWords] = await Promise.all([getAllSounds(), getAllWords()])
  const allWordsBySoundId = new Map<number, SoundWord[]>(
    allSounds.map((s) => [s.id, allWords.filter((w) => w.sound_id === s.id)]),
  )

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

  const steps: DailyStep[] = []

  const wordReview = buildWordReviewStep(reviewWords)
  if (wordReview) steps.push(wordReview)

  const contextPractice = buildContextPracticeStep(reviewWords)
  if (contextPractice) steps.push(contextPractice)

  if (primarySound) {
    const [targetWords, pairs] = await Promise.all([
      getWordsBySound(primarySound.id),
      getMinimalPairs(primarySound.id),
    ])

    const focus = buildPhonemeFocusStep(
      primarySound,
      targetWords,
      allSounds,
      allWordsBySoundId,
      pairs,
      hasProgress,
    )
    if (focus) steps.push(focus)

    const minimal = buildMinimalPairsStep(primarySound, pairs)
    if (minimal) steps.push(minimal)

    const listening = buildListeningStep(primarySound, targetWords)
    if (listening) steps.push(listening)
  }

  if (steps.length < DAILY_PLAN_STEP_COUNT) {
    const connectedStep = await buildConnectedSpeechStep()
    if (connectedStep) {
      steps.push(connectedStep)
    } else {
      const weakTopics = aiState?.grammar.weakTopics ?? []
      const weakDeckSlug = deckSlugForWeakTopics(weakTopics)
      const weakTopic = weakTopics.find((t) => t.errorRate > 0.4 && t.sampleCount >= 3)?.topic
      const sentenceSource = weakDeckSlug ?? (dayOfYear() % 2 === 0 ? 'lesson' : 'grammar-deck')
      const sentenceStep = await buildSentenceBuilderStep(sentenceSource, weakTopic)
      if (sentenceStep) steps.push(sentenceStep)
    }
  }

  if (steps.length < DAILY_PLAN_STEP_COUNT) {
    const weakTopics = aiState?.grammar.weakTopics ?? []
    const weakDeckSlug = deckSlugForWeakTopics(weakTopics)
    const weakTopic = weakTopics.find((t) => t.errorRate > 0.4 && t.sampleCount >= 3)?.topic
    const sentenceSource = weakDeckSlug ?? (dayOfYear() % 2 === 0 ? 'lesson' : 'grammar-deck')
    const sentenceStep = await buildSentenceBuilderStep(sentenceSource, weakTopic)
    if (sentenceStep) steps.push(sentenceStep)
  }

  let offset = 1
  const usedIds = new Set(steps.map((s) => s.id))
  while (steps.length < DAILY_PLAN_STEP_COUNT && offset <= allSounds.length) {
    const sound = pickSeedSound(allSounds, offset, primarySound?.id)
    offset++
    if (!sound) break

    const words = allWordsBySoundId.get(sound.id) ?? []
    if (words.length === 0) continue

    const focus = buildPhonemeFocusStep(sound, words, allSounds, allWordsBySoundId, [], false)
    if (focus && !usedIds.has(focus.id)) {
      steps.push(focus)
      usedIds.add(focus.id)
    }
  }

  const totalExercises = steps.reduce((sum, s) => sum + s.exercises.length, 0)

  return {
    steps: steps.slice(0, DAILY_PLAN_STEP_COUNT),
    totalExercises,
    isNewUser: !hasWordBank && !hasProgress,
  }
}
