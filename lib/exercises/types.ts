import type { CEFRLevel } from '@/lib/phoneme-practice/cefr'

// ── Source references ──────────────────────────────────────────────────────

export type ExerciseSource = 'words' | 'text_fragments' | 'word_bank'

export interface ExerciseSourceRef {
  source: ExerciseSource
  /** Primary key of the row that originated this exercise. */
  id: string
}

// ── Generic exercise types ─────────────────────────────────────────────────

export type GenericExerciseType =
  | 'fill_blank'
  | 'sentence_dictation'
  | 'match_pairs'
  | 'reorder_words'

interface BaseGenericExercise {
  /** Deterministic id: hash of type + sourceRef + stable payload fields. */
  id: string
  type: GenericExerciseType
  sourceRef: ExerciseSourceRef
  level?: CEFRLevel
}

// Fill in the blank ──────────────────────────────────────────────────────────
// Show a sentence with one word blanked out; choose from options.
export interface FillBlankExercise extends BaseGenericExercise {
  type: 'fill_blank'
  /** Sentence with the target word replaced by "___". */
  sentence: string
  /** The correct word to fill in. */
  answer: string
  /** Distractor words (same part-of-speech / difficulty). */
  options: string[]
  /** Optional hint (definition or translation). */
  hint?: string
}

// Sentence dictation ────────────────────────────────────────────────────────
// Listen to a sentence and type it out.
export interface SentenceDictationExercise extends BaseGenericExercise {
  type: 'sentence_dictation'
  /** The full sentence to transcribe. */
  sentence: string
  /** Remote audio URL if available; fallback to TTS when null. */
  audioUrl: string | null
}

// Match pairs ───────────────────────────────────────────────────────────────
// Connect left-column items to right-column items.
export interface MatchPair {
  id: string
  left: string  // word / term
  right: string // definition / translation / IPA
}

export interface MatchPairsExercise extends BaseGenericExercise {
  type: 'match_pairs'
  pairs: MatchPair[]
}

// Reorder words ─────────────────────────────────────────────────────────────
// Arrange shuffled word tokens into the correct sentence order.
export interface ReorderWordsExercise extends BaseGenericExercise {
  type: 'reorder_words'
  /** Correct sentence. */
  sentence: string
  /** Shuffled tokens (words). */
  tokens: string[]
}

export type GenericExercise =
  | FillBlankExercise
  | SentenceDictationExercise
  | MatchPairsExercise
  | ReorderWordsExercise

// ── Session answer ─────────────────────────────────────────────────────────

export interface GenericSessionAnswer {
  exerciseId: string
  exerciseType: GenericExerciseType
  sourceRef: ExerciseSourceRef
  isCorrect: boolean
  userAnswer: string
  timeMs: number
}
