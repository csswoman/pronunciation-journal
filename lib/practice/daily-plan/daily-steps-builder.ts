import { getSessionDataset, getSessionDatasets } from '@/lib/phoneme-practice/queries'
import { deckSlugForWeakTopics } from '@/lib/practice/topic-decks'
import type { DailyStep } from '@/lib/practice/types'
import type { Sound } from '@/lib/phoneme-practice/types'
import type { WordBankEntry } from '@/lib/word-bank/types'
import { normalizeFalseFriendsLevel } from '@/lib/false-friends/data'
import {
  buildConnectedSpeechStep,
  buildFalseFriendsStep,
  buildReaderStep,
  buildSentenceBuilderStep,
} from './async-step-builders'
import { getEffectiveFocus } from '@/lib/learning-focus/effective-focus'
import { buildStudyDeckStep, selectStudyDeckTarget } from './study-deck'
import { buildGrammarFocusStep } from './grammar-focus'
import { DAILY_PLAN_STEP_COUNT } from './constants'
import { isBrowserOnline } from './online'
import { fetchReaderTargetRows } from './reader-targets'
import { dayOfYear, pickSeedSound } from './selectors'
import type { WordCategoryIndex } from '@/lib/lexicon/domain-profile'
import {
  buildContextPracticeStep,
  buildListeningStep,
  buildMinimalPairsStep,
  buildPhonemeFocusStep,
  buildWordIntroStep,
  buildWordReviewStep,
} from './step-builders'
import type { SpeechConstraintId } from '@/lib/exercises/speech-constraints'
import type { CefrLevelId } from '@/lib/courses/types'
import type { UserLearningState } from '@/lib/ai-practice/learning-state'

const DEFAULT_GRAMMAR_DECK = 'a2-presente-perfecto-experiencias'

export interface BuildDailyCandidateStepsParams {
  userId: string
  allSounds: Sound[]
  primarySound: Sound | null
  reviewWords: WordBankEntry[]
  hasWordBank: boolean
  hasProgress: boolean
  activeLevel?: CefrLevelId
  completedLessonIds: Set<string>
  aiState: UserLearningState | null
  savedOrFamiliarWordIds: Set<string>
  wordIndex: WordCategoryIndex
  repairConstraints: SpeechConstraintId[]
}

export async function buildDailyCandidateSteps(
  params: BuildDailyCandidateStepsParams,
): Promise<{
  steps: DailyStep[]
  grammarStep: DailyStep | null
  studyDeckStep: DailyStep | null
  weakTopic?: string
}> {
  const {
    userId,
    allSounds,
    primarySound,
    reviewWords,
    hasWordBank,
    hasProgress,
    activeLevel,
    completedLessonIds,
    aiState,
    savedOrFamiliarWordIds,
    wordIndex,
    repairConstraints,
  } = params

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
    )
    if (focus) newSteps.push(focus)

    const minimal = buildMinimalPairsStep(primarySound, minimalPairs)
    if (minimal) newSteps.push(minimal)

    const listening = buildListeningStep(primarySound, targetWords)
    if (listening) newSteps.push(listening)
  }

  const falseFriendsLevel = normalizeFalseFriendsLevel(
    aiState?.level?.cefrEstimate,
  )

  const studyDeckActiveLevel = aiState?.focus
    ? getEffectiveFocus(aiState.focus).level
    : activeLevel
  const studyDeckTarget = selectStudyDeckTarget(
    completedLessonIds,
    studyDeckActiveLevel,
    aiState?.theory?.concepts,
  )
  const lessonDeckSlug = studyDeckTarget?.lesson.slug ?? null

  const weakTopics = aiState?.grammar.weakTopics ?? []
  const weakDeckSlug = deckSlugForWeakTopics(weakTopics)
  const weakTopic = weakTopics.find((t) => t.errorRate > 0.4 && t.sampleCount >= 3)?.topic

  const grammarDeckSlug = lessonDeckSlug ?? weakDeckSlug ?? DEFAULT_GRAMMAR_DECK
  const grammarStep = await buildGrammarFocusStep(
    grammarDeckSlug,
    reviewWords,
    'daily',
    repairConstraints,
  )
  const sentenceSource = lessonDeckSlug ?? weakDeckSlug ?? (dayOfYear() % 2 === 0 ? 'lesson' : 'grammar-deck')

  const allSteps = [...newSteps]

  if (allSteps.length < DAILY_PLAN_STEP_COUNT) {
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

  const wordIntro = buildWordIntroStep(reviewWords)
  if (wordIntro) reviewSteps.push(wordIntro)

  const wordReview = buildWordReviewStep(reviewWords, 'daily', savedOrFamiliarWordIds, wordIndex)
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
    studyDeckActiveLevel,
    aiState?.theory?.concepts,
  )
  const steps: DailyStep[] = [...allSteps, ...reviewSteps]

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
      )
      if (focus && !usedIds.has(focus.id)) {
        steps.push(focus)
        usedIds.add(focus.id)
      }
    }
  }

  return {
    steps,
    grammarStep,
    studyDeckStep,
    weakTopic,
  }
}
