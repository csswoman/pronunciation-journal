import type { ReactNode } from 'react'
import { MatchPairsExercise } from '@/components/exercises/MatchPairsExercise'
import { FillBlankExercise } from '@/components/exercises/FillBlankExercise'
import { ReorderWordsExercise } from '@/components/exercises/ReorderWordsExercise'
import { SentenceDictationExercise } from '@/components/exercises/SentenceDictationExercise'
import { MultipleChoiceExercise } from '@/components/exercises/MultipleChoiceExercise'
import { SentenceContextExercise } from '@/components/lexicon/SentenceContextExercise'
import { WrittenProductionExercise } from '@/components/exercises/WrittenProductionExercise'
import { SpokenProductionExercise } from '@/components/exercises/SpokenProductionExercise'
import { ErrorCorrectionExercise } from '@/components/exercises/ErrorCorrectionExercise'
import type {
  GenericExercise,
  GenericExerciseType,
  MatchPairsExercise as MatchPairsExerciseType,
  FillBlankExercise as FillBlankExerciseType,
  ReorderWordsExercise as ReorderWordsExerciseType,
  SentenceDictationExercise as SentenceDictationExerciseType,
  SentenceContextExercise as SentenceContextExerciseType,
  MultipleChoiceExercise as MultipleChoiceExerciseType,
  WrittenProductionExercise as WrittenProductionExerciseType,
  SpokenProductionExercise as SpokenProductionExerciseType,
  ErrorCorrectionExercise as ErrorCorrectionExerciseType,
} from '@/lib/exercises/types'
import type { PedagogicalFeedback } from '@/lib/practice/types'

export type GenericRenderExtras = { score?: number; feedback?: PedagogicalFeedback }

export type GenericRenderContext = {
  onResult: (
    isCorrect: boolean,
    userAnswer: string,
    timeMs: number,
    extras?: GenericRenderExtras,
  ) => void
  onSkip?: () => void
  focusUi?: boolean
  onHint?: () => void
  hintCount?: number
}

type GenericRegistryEntry = {
  title: string
  noHint?: boolean
  render: (exercise: GenericExercise, ctx: GenericRenderContext) => ReactNode
}

/**
 * Registry keyed by payload.data.type.
 * One cast per entry keeps the union narrow without wrapper boilerplate.
 */
export const GENERIC_REGISTRY: Record<GenericExerciseType, GenericRegistryEntry> = {
  match_pairs: {
    title: 'Empareja los pares',
    render: (exercise, { onResult }) => (
      <MatchPairsExercise
        exercise={exercise as MatchPairsExerciseType}
        onResult={onResult}
      />
    ),
    noHint: true,
  },
  fill_blank: {
    title: 'Complete the sentence',
    render: (exercise, { onResult, hintCount }) => (
      <FillBlankExercise
        exercise={exercise as FillBlankExerciseType}
        onResult={onResult}
        hintCount={hintCount ?? 0}
      />
    ),
  },
  reorder_words: {
    title: 'Put the words in the correct order',
    noHint: true,
    render: (exercise, { onResult, focusUi }) => (
      <ReorderWordsExercise
        exercise={exercise as ReorderWordsExerciseType}
        onResult={onResult}
        focusUi={focusUi}
      />
    ),
  },
  sentence_dictation: {
    title: 'Listen and type the sentence',
    render: (exercise, { onResult, hintCount }) => (
      <SentenceDictationExercise
        exercise={exercise as SentenceDictationExerciseType}
        onResult={onResult}
        hintCount={hintCount ?? 0}
      />
    ),
  },
  sentence_context: {
    title: 'Choose the best option',
    noHint: true,
    render: (exercise, { onResult }) => (
      <SentenceContextExercise
        exercise={exercise as SentenceContextExerciseType}
        onResult={onResult}
      />
    ),
  },
  multiple_choice: {
    title: 'Choose the correct answer',
    render: (exercise, { onResult, hintCount }) => (
      <MultipleChoiceExercise
        exercise={exercise as MultipleChoiceExerciseType}
        onResult={onResult}
        hintCount={hintCount ?? 0}
      />
    ),
  },
  written_production: {
    title: 'Escribe tu oración',
    noHint: true,
    render: (exercise, { onResult, onSkip }) => (
      <WrittenProductionExercise
        exercise={exercise as WrittenProductionExerciseType}
        onResult={onResult}
        onSkip={onSkip}
      />
    ),
  },
  spoken_production: {
    title: 'Di tu oración',
    noHint: true,
    render: (exercise, { onResult, onSkip }) => (
      <SpokenProductionExercise
        exercise={exercise as SpokenProductionExerciseType}
        onResult={onResult}
        onSkip={onSkip}
      />
    ),
  },
  error_correction: {
    title: 'Corrige la oración',
    render: (exercise, { onResult }) => <ErrorCorrectionExercise exercise={exercise as ErrorCorrectionExerciseType} onResult={onResult} />,
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

export function getGenericSupportsHint(type: GenericExerciseType): boolean {
  return !GENERIC_REGISTRY[type].noHint
}
