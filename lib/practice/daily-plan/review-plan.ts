import { getSessionDatasets } from '@/lib/phoneme-practice/queries'
import { buildFailedSentencesMixStep } from '@/lib/review/build-failed-exercises'
import { fetchRecentFailedSentences } from '@/lib/review/client-queries'
import { mergeReviewWords } from '@/lib/review/merge-words'
import type { DailyStep } from '@/lib/practice/types'
import type { Sound } from '@/lib/phoneme-practice/types'
import type { WordBankEntry } from '@/lib/word-bank/types'
import type { EssentialWordReviewItem, FailedSentenceItem, LessonReviewItem } from '@/lib/review/types'
import { isOptionalLinkStep } from './step-completion'
import { WORD_REVIEW_WORD_COUNT } from './constants'
import {
  fetchDueReviewWords,
  fetchDueSounds,
  fetchWeakWords,
} from './fetchers'
import { getSemanticContentKey } from './selectors'
import { getWordCategoryIndex } from '@/lib/lexicon/word-index-client'
import {
  buildContextPracticeStep,
  buildPhonemeFocusStep,
  buildWordReviewStep,
} from './step-builders'
import { loadDueChunkReviewStep } from '@/lib/chunk-of-day/queries'
import type { CEFRLevel } from '@/lib/exercises/cefr'

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
  weakWords?: WordBankEntry[]
  dueSounds?: Sound[]
  dueSoundIds?: number[]
  failedItems?: FailedSentenceItem[]
  dueLessons?: LessonReviewItem[]
  essentialWordsDue?: EssentialWordReviewItem[]
  includeChunkReview?: boolean
  learnerLevel: CEFRLevel
}

function buildLinkSteps(
  essentialWordsDue: readonly EssentialWordReviewItem[],
  dueLessons: readonly LessonReviewItem[],
): DailyStep[] {
  const steps: DailyStep[] = []
  if (essentialWordsDue.length > 0) {
    const uniqueWords = new Set(essentialWordsDue.map((item) => item.wordId)).size
    steps.push({
      id: 'review:essential-words',
      kind: 'concept',
      title: 'Palabras esenciales pendientes',
      subtitle: `${uniqueWords} ${uniqueWords === 1 ? 'palabra' : 'palabras'} · ${essentialWordsDue.length} acciones`,
      icon: 'BookOpen',
      exercises: [],
      estMinutes: Math.max(2, Math.ceil(essentialWordsDue.length / 2)),
      href: '/practice/essential-words',
      selection: {
        reason: 'due',
        targetRefs: essentialWordsDue.map((item) => `essential-word:${item.id}`),
        source: 'learning_items',
      },
    })
  }
  for (const lesson of dueLessons) {
    steps.push({
      id: `review:${lesson.id}`,
      kind: 'immersion_lesson',
      title: lesson.title,
      subtitle: lesson.typeLabel,
      icon: 'Clapperboard',
      exercises: [],
      estMinutes: 5,
      href: lesson.url,
      selection: {
        reason: 'due',
        targetRefs: [lesson.id],
        source: 'immersion_lesson_progress',
      },
    })
  }
  return steps
}

export async function buildReviewPlan(
  userId: string,
  options: BuildReviewPlanOptions,
): Promise<ReviewPlan> {
  const reviewContext = 'review' as const

  const [failedItems, weakWords, reviewWords, dueSounds, wordIndex, chunkStep] = await Promise.all([
    options.failedItems ?? fetchRecentFailedSentences(userId, 5),
    options.weakWords ?? fetchWeakWords(userId, WORD_REVIEW_WORD_COUNT),
    options.dueWords ?? fetchDueReviewWords(userId, WORD_REVIEW_WORD_COUNT),
    options.dueSounds ?? fetchDueSounds(userId),
    getWordCategoryIndex(),
    options.includeChunkReview === false
      ? Promise.resolve(null)
      : loadDueChunkReviewStep(userId, reviewContext, options.learnerLevel).catch(() => null),
  ])

  const mergedWords = mergeReviewWords(weakWords, reviewWords, WORD_REVIEW_WORD_COUNT)

  const steps: DailyStep[] = []

  if (chunkStep) steps.push(chunkStep)

  const failedStep = await buildFailedSentencesMixStep(failedItems, reviewContext)
  if (failedStep) steps.push(failedStep)

  const wordStep = buildWordReviewStep(mergedWords, reviewContext, undefined, wordIndex)
  if (wordStep) steps.push(wordStep)

  const contextStep = buildContextPracticeStep(mergedWords, reviewContext)
  if (contextStep) steps.push(contextStep)

  const soundIds = options.dueSoundIds ?? dueSounds.map((sound) => sound.id)
  const reviewDatasets = await getSessionDatasets(soundIds)

  for (const soundId of soundIds) {
    const dataset = reviewDatasets.get(soundId)
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

  steps.push(...buildLinkSteps(options.essentialWordsDue ?? [], options.dueLessons ?? []))

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
