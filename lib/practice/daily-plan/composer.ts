import { fetchEssentialWordsForDay } from '@/lib/essential-words/client-fetch'
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
import { buildJournalDailyStep, shouldOfferJournalStep } from '@/lib/journal/daily-step'
import { normalizeFalseFriendsLevel } from '@/lib/false-friends/data'
import { buildConnectedSpeechStep, buildFalseFriendsStep, buildReaderStep, buildSentenceBuilderStep } from './async-step-builders'
import { buildStudyDeckStep } from './study-deck'
import { DAILY_PLAN_STEP_COUNT, WORD_REVIEW_WORD_COUNT } from './constants'
import {
  fetchAllPracticedSounds,
  fetchDueReviewWords,
  fetchDueSounds,
  fetchNewWords,
  fetchSavedOrFamiliarWords,
  fetchWeakWords,
  fetchWeakestSoundProgress,
} from './fetchers'
import { isBrowserOnline } from './online'
import { fetchReaderTargetRows } from './reader-targets'
import { dayOfYear, pickSeedSound } from './selectors'
import { biasWordsBySound } from './sound-word-bridge'
import { selectDailyReviewWords } from './saved-priority'
import { candidate, selectDailyCandidates } from './policy'
import { missionForTarget, parseMissionLaunch } from '@/lib/ai-practice/missions/launch'
import { getTarget, phonemeTargetId } from '@/lib/pronunciation/targets/registry'
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

  const [failedItems, weakWords, reviewWords, dueSounds, essentialMatchWords] = await Promise.all([
    fetchRecentFailedSentences(userId, 5),
    fetchWeakWords(userId, WORD_REVIEW_WORD_COUNT),
    fetchDueReviewWords(userId, WORD_REVIEW_WORD_COUNT),
    fetchDueSounds(userId),
    fetchEssentialWordsForDay(dayOfYear(), 4),
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
      essentialMatchWords,
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

  const [newWords, dueWords, savedOrFamiliarWords] = await Promise.all([
    fetchNewWords(userId, WORD_REVIEW_WORD_COUNT),
    fetchDueReviewWords(userId, WORD_REVIEW_WORD_COUNT),
    fetchSavedOrFamiliarWords(userId, WORD_REVIEW_WORD_COUNT),
  ])
  const dailyWordSelection = selectDailyReviewWords({
    newWords,
    dueWords,
    savedOrFamiliarWords,
    limit: WORD_REVIEW_WORD_COUNT,
  })
  let reviewWords = dailyWordSelection.words
  const hasWordBank = reviewWords.length > 0

  if (reviewWords.length === 0) {
    reviewWords = await fetchEssentialWordsForDay(dayOfYear(), WORD_REVIEW_WORD_COUNT)
  }
  const essentialMatchWords = hasWordBank
    ? await fetchEssentialWordsForDay(dayOfYear(), 4)
    : reviewWords.slice(0, 4)

  const readCompletedLessons = async () => {
    const store = db.completedLessons as typeof db.completedLessons & {
      toArray?: () => Promise<Array<{ key: string; userId?: string; courseSlug?: string; lessonSlug?: string }>>
    }
    if (typeof store.where === 'function') {
      return store.where('userId').equals(userId).toArray()
    }
    return (await store.toArray?.() ?? []).filter((lesson) => lesson.userId === userId)
  }

  const [weakest, localLearningState, completedLessons] = await Promise.all([
    fetchWeakestSoundProgress(userId),
    db.learningState.get(userId).catch(() => null),
    readCompletedLessons().catch(() => []),
  ])
  const aiState = localLearningState?.state ?? null
  const hasProgress = weakest != null
  const activeLevel = localLearningState?.state.level.cefrEstimate.toLowerCase() as import('@/lib/courses/types').CefrLevelId | undefined
  const completedLessonIds = new Set(completedLessons.map((lesson) => `${lesson.courseSlug}:${lesson.lessonSlug}`))

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
      'daily',
      essentialMatchWords,
    )
    if (focus) newSteps.push(focus)

    const minimal = buildMinimalPairsStep(primarySound, minimalPairs)
    if (minimal) newSteps.push(minimal)

    const listening = buildListeningStep(primarySound, targetWords)
    if (listening) newSteps.push(listening)
  }

  // False friends are gated by level so a beginner never meets a C1 pair.
  // Defaults to B1 when the learner has no estimate yet — the bank's densest band.
  const falseFriendsLevel = normalizeFalseFriendsLevel(
    localLearningState?.state.level.cefrEstimate,
  )

  const weakTopics = aiState?.grammar.weakTopics ?? []
  const weakDeckSlug = deckSlugForWeakTopics(weakTopics)
  const weakTopic = weakTopics.find((t) => t.errorRate > 0.4 && t.sampleCount >= 3)?.topic
  const sentenceSource = weakDeckSlug ?? (dayOfYear() % 2 === 0 ? 'lesson' : 'grammar-deck')

  const allSteps = [...newSteps]

  if (allSteps.length < DAILY_PLAN_STEP_COUNT) {
    // Even days: connected speech. Odd days: false friends. Both fall back to
    // the sentence builder so the slot is never lost.
    const connectedStep = await buildConnectedSpeechStep()
    const alternateStep = connectedStep ?? await buildFalseFriendsStep(falseFriendsLevel)
    if (alternateStep) {
      allSteps.push(alternateStep)
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

  const wordReview = buildWordReviewStep(reviewWords, 'daily', dailyWordSelection.savedOrFamiliarIds)
  if (wordReview) reviewSteps.push(wordReview)

  const contextPractice = buildContextPracticeStep(reviewWords)
  if (contextPractice) reviewSteps.push(contextPractice)

  if (hasWordBank) {
    const readerRows = await fetchReaderTargetRows()
    try {
      const readerStep = await buildReaderStep(userId, readerRows, isBrowserOnline())
      if (readerStep) reviewSteps.push(readerStep)
    } catch (err) {
      console.error('[buildDailyPlan] reader step failed', err)
    }
  }

  const studyDeckStep = buildStudyDeckStep(
    completedLessonIds,
    activeLevel,
    aiState?.theory?.concepts,
  )
  let steps: DailyStep[] = [...allSteps, ...reviewSteps]

  // When SRS items are due, prepend top review-hub steps so the daily plan surfaces them first.
  const hasDueSrs =
    dueWords.length > 0 ||
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
        'daily',
        essentialMatchWords,
      )
      if (focus && !usedIds.has(focus.id)) {
        steps.push(focus)
        usedIds.add(focus.id)
      }
    }
  }

  const rawPrimaryTarget = primarySound
    ? phonemeTargetId(`/${primarySound.ipa.replace(/^\/+|\/+$/g, '')}/`)
    : null
  const primaryTarget = rawPrimaryTarget && getTarget(rawPrimaryTarget).ok ? rawPrimaryTarget : null
  const mission = primaryTarget ? missionForTarget(primaryTarget) : null
  const missionStep: DailyStep | null = mission && primaryTarget
    ? {
        kind: 'mission',
        id: `mission:${mission.id}:${primaryTarget}`,
        title: 'Usa el foco en una conversación',
        subtitle: 'Misión oral con un objetivo exacto',
        icon: 'Messages',
        exercises: [],
        estMinutes: 5,
        missionLaunch: parseMissionLaunch({
          missionId: mission.id,
          targetIds: [primaryTarget],
          source: 'daily',
          stepId: `mission:${mission.id}:${primaryTarget}`,
        }),
      }
    : null

  const targetRefsForStep = (step: DailyStep): string[] => {
    if (step.kind === 'mission' && step.missionLaunch) return step.missionLaunch.targetIds
    if (['phoneme_focus', 'minimal_pairs', 'listening'].includes(step.kind)) {
      return [primaryTarget ?? `sound:${step.ipa ?? primarySound?.id ?? step.id}`]
    }
    if (step.kind === 'word_intro') return (step.featuredWords ?? []).map((word) => `exposure:word:${word}`)
    if (step.kind === 'word_review') return step.exercises.map((exercise) => `word-meaning:${exercise.sourceRef?.id ?? exercise.contentId}`)
    if (step.kind === 'context_practice' || step.kind === 'reader') {
      return step.exercises.map((exercise) => `word-context:${exercise.sourceRef?.id ?? exercise.contentId}`)
    }
    if (step.kind === 'study_deck' || step.kind === 'concept') return [step.id]
    return step.exercises.length > 0 ? step.exercises.map((exercise) => exercise.contentId) : [step.id]
  }
  const reasonForStep = (step: DailyStep) => {
    if (step.id.startsWith('review_') || (hasDueSrs && step.kind === 'word_review')) return 'due' as const
    if (step.id.includes('failed') || step.kind === 'sentence_builder' && weakTopic) return 'recent_error' as const
    if (hasProgress && ['phoneme_focus', 'minimal_pairs', 'listening'].includes(step.kind)) return 'weak_target' as const
    if (step.kind === 'study_deck') return 'route_next' as const
    if (step.kind === 'word_review' && dailyWordSelection.savedOrFamiliarIds.size > 0) return 'saved_intent' as const
    return 'variety' as const
  }
  const candidates = [...steps, ...(studyDeckStep ? [studyDeckStep] : []), ...(missionStep ? [missionStep] : [])]
    .map((step) => candidate(step, {
      reason: reasonForStep(step),
      targetRefs: targetRefsForStep(step),
      source: step.kind === 'mission' ? 'pronunciation_route' : step.kind,
      ...(step.kind === 'mission' ? { requiredCapability: 'speech_recognition' as const } : {}),
    }))
  let finalSteps = selectDailyCandidates(candidates, {
    limit: DAILY_PLAN_STEP_COUNT,
    availableCapabilities: new Set(['network', 'microphone', 'speech_recognition']),
  })

  // Optional Journal link: appended AFTER the cap on its cadence so it never
  // displaces an evaluated step. Concept steps carry no exercises and are not
  // auto-completed, so the daily practice guarantee is unchanged.
  if (shouldOfferJournalStep(dayOfYear()) && !finalSteps.some((step) => step.id === 'journal_entry')) {
    finalSteps = [...finalSteps, buildJournalDailyStep()]
  }

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
