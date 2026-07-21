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
import { ConjugationBlankExercise } from '@/components/exercises/ConjugationBlankExercise'
import { SentenceTransformationExercise } from '@/components/exercises/SentenceTransformationExercise'
import { TranslationEsEnExercise } from '@/components/exercises/TranslationEsEnExercise'
import { CsShadowPhraseExercise } from '@/components/exercises/CsShadowPhraseExercise'
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
  ConjugationBlankExercise as ConjugationBlankExerciseType,
  SentenceTransformationExercise as SentenceTransformationExerciseType,
  TranslationEsEnExercise as TranslationEsEnExerciseType,
  CsShadowPhraseExercise as CsShadowPhraseExerciseType,
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
}

type ExerciseFor<Type extends GenericExerciseType> = Extract<GenericExercise, { type: Type }>

type GenericRegistry = {
  [Type in GenericExerciseType]: GenericRegistryEntry & {
    render: (exercise: ExerciseFor<Type>, ctx: GenericRenderContext) => ReactNode
  }
}

/**
 * Registry keyed by payload.data.type.
 * Each entry receives the exact member of the discriminated exercise union.
 */
export const GENERIC_REGISTRY: GenericRegistry = {
  match_pairs: {
    title: 'Empareja los pares',
    render: (exercise: MatchPairsExerciseType, { onResult }) => (
      <MatchPairsExercise
        exercise={exercise}
        onResult={onResult}
      />
    ),
    noHint: true,
  },
  fill_blank: {
    title: 'Complete the sentence',
    render: (exercise: FillBlankExerciseType, { onResult, hintCount }) => (
      <FillBlankExercise
        exercise={exercise}
        onResult={onResult}
        hintCount={hintCount ?? 0}
      />
    ),
  },
  reorder_words: {
    title: 'Put the words in the correct order',
    noHint: true,
    render: (exercise: ReorderWordsExerciseType, { onResult, focusUi }) => (
      <ReorderWordsExercise
        exercise={exercise}
        onResult={onResult}
        focusUi={focusUi}
      />
    ),
  },
  sentence_dictation: {
    title: 'Listen and type the sentence',
    render: (exercise: SentenceDictationExerciseType, { onResult, hintCount }) => (
      <SentenceDictationExercise
        exercise={exercise}
        onResult={onResult}
        hintCount={hintCount ?? 0}
      />
    ),
  },
  sentence_context: {
    title: 'Choose the best option',
    noHint: true,
    render: (exercise: SentenceContextExerciseType, { onResult }) => (
      <SentenceContextExercise
        exercise={exercise}
        onResult={onResult}
      />
    ),
  },
  multiple_choice: {
    title: 'Choose the correct answer',
    render: (exercise: MultipleChoiceExerciseType, { onResult, hintCount }) => (
      <MultipleChoiceExercise
        exercise={exercise}
        onResult={onResult}
        hintCount={hintCount ?? 0}
      />
    ),
  },
  written_production: {
    title: 'Escribe tu oración',
    noHint: true,
    render: (exercise: WrittenProductionExerciseType, { onResult, onSkip }) => (
      <WrittenProductionExercise
        exercise={exercise}
        onResult={onResult}
        onSkip={onSkip}
      />
    ),
  },
  spoken_production: {
    title: 'Di tu oración',
    noHint: true,
    render: (exercise: SpokenProductionExerciseType, { onResult, onSkip }) => (
      <SpokenProductionExercise
        exercise={exercise}
        onResult={onResult}
        onSkip={onSkip}
      />
    ),
  },
  error_correction: { title: 'Corrige la oración', render: (exercise: ErrorCorrectionExerciseType, { onResult }) => <ErrorCorrectionExercise exercise={exercise} onResult={onResult} /> },
  conjugation_blank: { title: 'Completa el verbo', render: (exercise: ConjugationBlankExerciseType, { onResult }) => <ConjugationBlankExercise exercise={exercise} onResult={onResult} /> },
  sentence_transformation: { title: 'Transforma la oración', noHint: true, render: (exercise: SentenceTransformationExerciseType, { onResult, onSkip }) => <SentenceTransformationExercise exercise={exercise} onResult={onResult} onSkip={onSkip} /> },
  translation_es_en: { title: 'Traduce al inglés', noHint: true, render: (exercise: TranslationEsEnExerciseType, { onResult }) => <TranslationEsEnExercise exercise={exercise} onResult={onResult} /> },
  cs_shadow_phrase: {
    title: 'Shadow the phrase',
    noHint: true,
    render: (exercise: CsShadowPhraseExerciseType, { onResult, onSkip }) => (
      <CsShadowPhraseExercise exercise={exercise} onResult={onResult} onSkip={onSkip} />
    ),
  },
}

/**
 * Preserve the discriminant correlation at the dynamic registry lookup.
 */
function getGenericRegistryEntry<Type extends GenericExerciseType>(type: Type): GenericRegistry[Type] {
  return GENERIC_REGISTRY[type]
}

export function renderGenericExercise<Type extends GenericExerciseType>(
  data: ExerciseFor<Type>,
  ctx: GenericRenderContext,
): ReactNode {
  const entry = getGenericRegistryEntry(data.type)
  return entry.render(data, ctx)
}

export function getGenericTitle(type: GenericExerciseType): string {
  return GENERIC_REGISTRY[type].title
}

export function getGenericSupportsHint(type: GenericExerciseType): boolean {
  return !GENERIC_REGISTRY[type].noHint
}
