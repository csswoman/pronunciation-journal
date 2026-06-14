import type { ReactNode } from 'react'
import { MatchPairsExercise } from '@/components/exercises/MatchPairsExercise'
import { FillBlankExercise } from '@/components/exercises/FillBlankExercise'
import { ReorderWordsExercise } from '@/components/exercises/ReorderWordsExercise'
import { SentenceDictationExercise } from '@/components/exercises/SentenceDictationExercise'
import { MultipleChoiceExercise } from '@/components/exercises/MultipleChoiceExercise'
import { SentenceContextExercise } from '@/components/lexicon/SentenceContextExercise'
import type {
  GenericExercise,
  GenericExerciseType,
  MatchPairsExercise as MatchPairsExerciseType,
  FillBlankExercise as FillBlankExerciseType,
  ReorderWordsExercise as ReorderWordsExerciseType,
  SentenceDictationExercise as SentenceDictationExerciseType,
  SentenceContextExercise as SentenceContextExerciseType,
  MultipleChoiceExercise as MultipleChoiceExerciseType,
} from '@/lib/exercises/types'

export type GenericRenderContext = {
  onResult: (isCorrect: boolean, userAnswer: string, timeMs: number) => void
  focusUi?: boolean
}

type GenericRegistryEntry = {
  title: string
  render: (exercise: GenericExercise, ctx: GenericRenderContext) => ReactNode
}

/**
 * Registry keyed by payload.data.type.
 * One cast per entry keeps the union narrow without wrapper boilerplate.
 */
export const GENERIC_REGISTRY: Record<GenericExerciseType, GenericRegistryEntry> = {
  match_pairs: {
    title: 'Match the pairs',
    render: (exercise, { onResult }) => (
      <MatchPairsExercise
        exercise={exercise as MatchPairsExerciseType}
        onResult={onResult}
      />
    ),
  },
  fill_blank: {
    title: 'Complete the sentence',
    render: (exercise, { onResult }) => (
      <FillBlankExercise
        exercise={exercise as FillBlankExerciseType}
        onResult={onResult}
      />
    ),
  },
  reorder_words: {
    title: 'Put in order',
    render: (exercise, { onResult, focusUi }) => (
      <ReorderWordsExercise
        exercise={exercise as ReorderWordsExerciseType}
        onResult={onResult}
        focusUi={focusUi}
      />
    ),
  },
  sentence_dictation: {
    title: 'Listen and type',
    render: (exercise, { onResult }) => (
      <SentenceDictationExercise
        exercise={exercise as SentenceDictationExerciseType}
        onResult={onResult}
      />
    ),
  },
  sentence_context: {
    title: 'Choose the best option',
    render: (exercise, { onResult }) => (
      <SentenceContextExercise
        exercise={exercise as SentenceContextExerciseType}
        onResult={onResult}
      />
    ),
  },
  multiple_choice: {
    title: 'Choose the correct answer',
    render: (exercise, { onResult }) => (
      <MultipleChoiceExercise
        exercise={exercise as MultipleChoiceExerciseType}
        onResult={onResult}
      />
    ),
  },
}

export function renderGenericExercise(
  data: GenericExercise,
  ctx: GenericRenderContext,
): ReactNode {
  return GENERIC_REGISTRY[data.type]?.render(data, ctx) ?? null
}

export function getGenericTitle(type: GenericExerciseType): string {
  return GENERIC_REGISTRY[type].title
}
