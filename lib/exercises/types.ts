import type { CEFRLevel } from '@/lib/exercises/cefr'
import type { PronunciationTargetId } from '@/lib/pronunciation/targets/types'
import type { SpeechConstraint } from '@/lib/exercises/speech-constraints'
import type { ExerciseType as CanonicalExerciseType } from './taxonomy'

// ── Source references ──────────────────────────────────────────────────────

export type ExerciseSource = 'words' | 'text_fragments' | 'word_bank' | 'core1k' | 'lexicon' | 'false_friends' | 'tracked_items' | 'grammar_deck'

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
  | 'sentence_context'
  | 'multiple_choice'
  | 'written_production'
  | 'spoken_production'
  | 'error_correction'
  | 'conjugation_blank'
  | 'sentence_transformation'
  | 'translation_es_en'
  | 'cs_shadow_phrase'

interface BaseGenericExercise {
  /** Deterministic id: hash of type + sourceRef + stable payload fields. */
  id: string
  type: GenericExerciseType
  /** Canonical taxonomy (domain + mode + optional variant). */
  exerciseType?: CanonicalExerciseType
  sourceRef: ExerciseSourceRef
  level?: CEFRLevel
  /** Concept label this exercise teaches (e.g. "grammar:present simple"). The SRS boundary canonicalizes legacy underscores. Absent for word/phoneme-sourced exercises. */
  topic?: string
  /** Course/deck lesson slug associated with this exercise */
  lessonSlug?: string
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
  /** Progressive hints: level1 = first letter, level2 = definition, level3 = translation. */
  hints?: { level1: string; level2: string; level3?: string }
}

// Sentence dictation ────────────────────────────────────────────────────────
// Listen to a sentence and type it out.
export interface SentenceDictationExercise extends BaseGenericExercise {
  type: 'sentence_dictation'
  /** The full sentence to transcribe. */
  sentence: string
  /** Remote audio URL if available; fallback to TTS when null. */
  audioUrl: string | null
  /** The target vocabulary word being practiced. */
  targetWord?: string
  /** English meaning/definition of the target word. */
  targetMeaning?: string
}

// Match pairs ───────────────────────────────────────────────────────────────
// Connect left-column items to right-column items.
export interface MatchPair {
  id: string
  left: string  // word / term
  right: string // definition / translation / IPA
}

export interface MatchPairsExercise extends Omit<BaseGenericExercise, 'sourceRef'> {
  type: 'match_pairs'
  /**
   * Absent: match_pairs grades a group answer, not a single word — there is
   * no per-pair result in the session pipeline (one exercise submission =
   * one ExerciseResult), so attributing the whole group to any one pair's
   * source would silently corrupt that word's SM-2 state. The exercise
   * still records answer_history evidence; it is simply not SRS-eligible.
   */
  sourceRef?: ExerciseSourceRef
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

// Sentence context ───────────────────────────────────────────────────────────
// Show a sentence with the target word blanked; pick from 4 options.
// Audio plays the full sentence (word included, not omitted).
export interface SentenceContextOption {
  id: string
  word: string
}

export interface SentenceContextExercise extends Omit<BaseGenericExercise, 'sourceRef'> {
  type: 'sentence_context'
  /**
   * Absent when the practiced word has no corresponding `word_bank` row
   * (e.g. an unsaved Dictionary item) — the exercise still produces answer
   * evidence but is not SRS-eligible against any bank row.
   */
  sourceRef?: ExerciseSourceRef
  /** Full sentence with the target word replaced by "___". */
  sentence: string
  /** The full original sentence (for audio + post-answer reveal). */
  fullSentence: string
  /** The correct word. */
  answer: string
  /** The word's definition (shown in feedback). */
  definition: string
  /** Four options: one correct + three distractors. */
  options: SentenceContextOption[]
}

// Multiple choice ───────────────────────────────────────────────────────────
// Show a question and pick the correct answer from a list.
export interface MultipleChoiceExercise extends BaseGenericExercise {
  type: 'multiple_choice'
  /** The question text. */
  question: string
  /** All answer options (4 items). */
  options: string[]
  /** Index into options[] that is correct. */
  answerIndex: number
  /** Shown after answering — explains why the correct answer is right. */
  explanation?: string
}

export interface ErrorCorrectionExercise extends BaseGenericExercise {
  type: 'error_correction'
  sentence: string
  correctSentence: string
  explanation?: string
}

export interface ConjugationBlankExercise extends BaseGenericExercise {
  type: 'conjugation_blank'
  sentence: string
  lemma: string
  answer: string
  hint?: string
  acceptedAnswers?: string[]
}

export interface SentenceTransformationExercise extends BaseGenericExercise {
  type: 'sentence_transformation'
  sourceSentence: string
  instruction: string
  referenceAnswer?: string
}

export interface TranslationEsEnExercise extends BaseGenericExercise {
  type: 'translation_es_en'
  sourceEs: string
  referenceEn: string
  acceptedAnswers?: string[]
}

// Free production (online-only — requires /api/gemini/grade-production) ───────
interface BaseProductionExercise extends BaseGenericExercise {
  /** Instruction shown to the learner. */
  taskPrompt: string
  /** Vocabulary item the learner must use. */
  targetItem: string
  targetMeaning?: string
  targetIpa?: string
  /** Optional model sentence (hint only, not copied). */
  exampleSentence?: string
  /**
   * Communicative constraint the learner must satisfy (tense or function).
   * Optional so legacy persisted exercises still typecheck.
   */
  constraint?: SpeechConstraint
}

export interface WrittenProductionExercise extends BaseProductionExercise {
  type: 'written_production'
}

export interface SpokenProductionExercise extends BaseProductionExercise {
  type: 'spoken_production'
}

// Connected-speech shadow phrase ─────────────────────────────────────────────
// Model audio, then the learner shadows the phrase aloud. Scored locally via
// scorePronunciation() (STT intelligibility) — no Gemini grading, unlike the
// free-production types above. Completion (advancing past the exercise) is
// tracked separately from whether the attempt was actually scored: an
// unsupported/failed recognition still lets the learner continue, honestly
// unscored, matching the SpokenAttempt outcome contract (plan 063 step 1).
export interface CsShadowPhraseExercise extends BaseGenericExercise {
  type: 'cs_shadow_phrase'
  /** The full sentence to shadow (already embeds the connected-speech feature). */
  phrase: string
  /** Authored phrase-level IPA. Omitted when the source deck does not provide it. */
  phraseIpa?: string
  /** Which connected-speech deck this phrase came from (linking, reductions, etc). */
  deckSlug: string
  /** One authored target at most: a phrase-level STT score cannot update a group. */
  pronunciationTargetId?: PronunciationTargetId
}

export type GenericExercise =
  | FillBlankExercise
  | SentenceDictationExercise
  | MatchPairsExercise
  | ReorderWordsExercise
  | SentenceContextExercise
  | MultipleChoiceExercise
  | ErrorCorrectionExercise
  | ConjugationBlankExercise
  | SentenceTransformationExercise
  | TranslationEsEnExercise
  | WrittenProductionExercise
  | SpokenProductionExercise
  | CsShadowPhraseExercise

// ── Session answer ─────────────────────────────────────────────────────────

export interface GenericSessionAnswer {
  exerciseId: string
  /** Canonical taxonomy (domain + mode + optional variant). */
  exerciseTypeCanonical?: CanonicalExerciseType
  exerciseType: GenericExerciseType
  sourceRef: ExerciseSourceRef
  isCorrect: boolean
  userAnswer: string
  timeMs: number
}
