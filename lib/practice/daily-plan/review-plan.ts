import { fetchEssentialWordsForDay } from '@/lib/essential-words/client-fetch'
import { getSessionDatasets } from '@/lib/phoneme-practice/queries'
import { buildFailedSentencesMixStep } from '@/lib/review/build-failed-exercises'
import { fetchRecentFailedSentences } from '@/lib/review/client-queries'
import { mergeReviewWords } from '@/lib/review/merge-words'
import type { DailyStep } from '@/lib/practice/types'
import type { Sound } from '@/lib/phoneme-practice/types'
import type { WordBankEntry } from '@/lib/word-bank/types'
import { isOptionalLinkStep } from './step-completion'
import { WORD_REVIEW_WORD_COUNT } from './constants'
import {
  fetchAllPracticedSounds,
  fetchDueReviewWords,
  fetchDueSounds,
  fetchWeakWords,
} from './fetchers'
import { dayOfYear, getSemanticContentKey } from './selectors'
import { getWordCategoryIndex } from '@/lib/lexicon/word-index-client'
import {
  buildContextPracticeStep,
  buildPhonemeFocusStep,
  buildWordReviewStep,
} from './step-builders'

export type ReviewPlan = {
  steps: DailyStep[]
  totalExercises: number
  /** true si no hay nada pendiente de repasar hoy. */
  nothingDue: boolean
}

export function shouldKeepNonExerciseStep(step: DailyStep): boolean {
  return step.kind === 'word_intro' || step.kind === 'mission' || step.kind === 'reader' || isOptionalLinkStep(step)
}

export interface BuildReviewPlanOptions {
  dueWords?: WordBankEntry[]
  dueSounds?: Sound[]
  essentialMatchWords?: WordBankEntry[]
}

export async function buildReviewPlan(
  userId: string,
  options?: BuildReviewPlanOptions,
): Promise<ReviewPlan> {
  const reviewContext = 'review' as const

  const [failedItems, weakWords, reviewWords, dueSounds, essentialMatchWords, wordIndex] = await Promise.all([
    fetchRecentFailedSentences(userId, 5),
    fetchWeakWords(userId, WORD_REVIEW_WORD_COUNT),
    options?.dueWords ?? fetchDueReviewWords(userId, WORD_REVIEW_WORD_COUNT),
    options?.dueSounds ?? fetchDueSounds(userId),
    options?.essentialMatchWords ?? fetchEssentialWordsForDay(dayOfYear(), 4),
    getWordCategoryIndex(),
  ])

  const mergedWords = mergeReviewWords(weakWords, reviewWords, WORD_REVIEW_WORD_COUNT)

  const steps: DailyStep[] = []

  const failedStep = await buildFailedSentencesMixStep(failedItems, reviewContext)
  if (failedStep) steps.push(failedStep)

  const wordStep = buildWordReviewStep(mergedWords, reviewContext, undefined, wordIndex)
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

  // Deduplicar ejercicios cruzados a lo largo de todos los pasos
  const seenContent = new Set<string>()
  const dedupedSteps = steps.map(step => {
    const exercises = step.exercises.filter((ex) => {
      const key = getSemanticContentKey(ex)
      if (seenContent.has(key)) return false
      seenContent.add(key)
      return true
    })
    return { ...step, exercises }
  }).filter((step) => step.exercises.length > 0 || shouldKeepNonExerciseStep(step))

  const totalExercises = dedupedSteps.reduce((sum, s) => sum + s.exercises.length, 0)

  return {
    steps: dedupedSteps,
    totalExercises,
    nothingDue: dedupedSteps.length === 0,
  }
}
