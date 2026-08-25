import type React from 'react'
import type { CEFRLevel } from '@/lib/exercises/cefr'
import type { AudioStimulus, Option } from '@/lib/phoneme-practice/types'
import type {
  ExerciseSourceRef,
  GenericExercise,
} from '@/lib/exercises/types'
import type {
  AttributionVersion,
  EvidenceAttribution,
} from '@/lib/practice/attribution'
import type { FalseFriendIntro, StudyCardModel } from '@/lib/practice/study-card/model'
import type { ReaderPassage } from '@/lib/practice/reader/types'
import type { MissionLaunch } from '@/lib/ai-practice/missions/launch'
import type { ExerciseErrorCode } from '@/lib/exercises/error-taxonomy'
import type { WarmupShadowPhrase } from '@/lib/exercises/generators/warmup'

// Slugs mapped from `exercise_types` rows in Supabase.
// Keep in sync with supabase/migrations/20260329230300_seed_exercise_types.sql.
export type ExerciseSlug =
  | 'pick_word'          // id: 1
  | 'pick_sound'         // id: 2
  | 'minimal_pair'       // id: 3
  | 'dictation'          // id: 4
  | 'fill_blank'         // id: 5
  | 'sentence_dictation' // id: 6
  | 'match_pairs'        // id: 7
  | 'reorder_words'      // id: 8
  | 'speak_word'         // id: 10
  | 'identify'           // id: 11
  | 'ax_same_different'  // id: 12
  | 'odd_one_out'        // id: 13
  | 'abx'               // id: 14
  | 'sentence_context'   // id: 18
  | 'multiple_choice'    // id: 17
  | 'reader'             // no DB row — comprehensible input, does not write to answer_history
  | 'written_production' // id: 15 — online-only (AI grading)
  | 'spoken_production'  // id: 16 — online-only (AI grading)
  | 'error_correction'   // id: 19
  | 'conjugation_blank'  // id: 21
  | 'sentence_transformation' // id: 20
  | 'translation_es_en' // id: 22
  | 'cs_shadow_phrase' // id: 23 — connected-speech shadow/production step (local STT, no Gemini)

// null signals "no exercise_types FK" — this exercise does not write to answer_history.
export const EXERCISE_TYPE_IDS: Record<ExerciseSlug, number | null> = {
  pick_word: 1,
  pick_sound: 2,
  minimal_pair: 3,
  dictation: 4,
  fill_blank: 5,
  sentence_dictation: 6,
  match_pairs: 7,
  reorder_words: 8,
  speak_word: 10,
  identify: 11,
  ax_same_different: 12,
  odd_one_out: 13,
  abx: 14,
  sentence_context: 18,
  multiple_choice: 17,
  reader: null,
  written_production: 15,
  spoken_production: 16,
  error_correction: 19,
  conjugation_blank: 21,
  sentence_transformation: 20,
  translation_es_en: 22,
  cs_shadow_phrase: 23,
}

const EXERCISE_SLUG_BY_TYPE_ID = new Map<number, ExerciseSlug>()
for (const [slug, id] of Object.entries(EXERCISE_TYPE_IDS) as Array<[ExerciseSlug, number | null]>) {
  if (id === null) continue
  if (EXERCISE_SLUG_BY_TYPE_ID.has(id)) {
    throw new Error(`Duplicate exercise type id ${id}`)
  }
  EXERCISE_SLUG_BY_TYPE_ID.set(id, slug)
}

/** The single DB-id → exercise identity projection for legacy answer rows. */
export function slugForExerciseTypeId(id: number | null | undefined): ExerciseSlug | null {
  return id == null ? null : EXERCISE_SLUG_BY_TYPE_ID.get(id) ?? null
}

export type PracticeContext =
  | 'sound_lab'
  | 'courses'
  | 'ai_coach'
  | 'practice'
  | 'daily'
  | 'essential-words'
  | 'review'

export type PhonemePayload = {
  kind: 'phoneme'
  ipa: string
  targetWord?: string
  options: Option[]
  correctIds: string[]
  /** Ordered audio stimuli for AX / ABX / odd-one-out drills. */
  stimuli?: AudioStimulus[]
  abxAnswer?: 0 | 1
  oddIndex?: number
  /** The contrast this exercise was built to target, when applicable (see buildAdaptiveSession). */
  contrastId?: string
}

export type GenericPayload = {
  kind: 'generic'
  data: GenericExercise
}

export type PracticeExercise = {
  /** Deterministic id used to dedupe within a session. */
  id: string
  slug: ExerciseSlug
  /** FK to `exercise_types.id`. Null for exercises that do not write to answer_history. */
  exerciseTypeId: number | null
  /** What was practiced (word slug, lesson id, soundId stringified, etc.). */
  contentId: string
  context: PracticeContext
  payload: PhonemePayload | GenericPayload
  level?: CEFRLevel
  /** Only set for phoneme-domain exercises. */
  soundId?: number
  /**
   * Plan 062: contrast key (`ipaA|ipaB`) when this exercise updates
   * `user_contrast_progress`. Independent of PHONEME_CONFUSION array order.
   */
  contrastId?: string
  /** Only set for generic exercises. */
  sourceRef?: ExerciseSourceRef
}

export type PracticeResultStatus = 'answered' | 'skipped' | 'unscored' | 'evaluator_failed'

export type PracticeAnswer = {
  /** Stable caller-provided identity makes retries idempotent in answer_history. */
  attemptId?: string
  exerciseId: string
  slug: ExerciseSlug
  /** Null for exercises that do not write to answer_history. */
  exerciseTypeId: number | null
  isCorrect: boolean
  userAnswer?: string
  timeMs: number
  /** Discriminates genuine attempts from skips, unscored exposure or technical failures. */
  status?: PracticeResultStatus
  /** Latency until the first user response (used for time-sensitive grading). */
  responseTimeMs?: number
  /** Total elapsed time on the exercise including feedback reading and retries (for analytics). */
  totalInteractionMs?: number
  /** True if the user failed their first try before retrying and succeeding. */
  firstTryFailed?: boolean
  /** 0-100, currently used by speak_word. */
  score?: number
  feedback?: PedagogicalFeedback
  contentId: string
  context: PracticeContext
  /** Forwarded to `answer_history.sound_id` for phoneme exercises. */
  soundId?: number
  exercisePayload?: unknown
  /** Carried from PracticeExercise; used to build a prefixed content_id for SRS routing. */
  sourceRef?: ExerciseSourceRef
  /**
   * Plan 062: explicit SRS targets/outcomes for this answer.
   * Prefer this over inferring identity from `sourceRef` alone.
   * Absent = legacy evidence (do not invent targets).
   */
  attribution?: EvidenceAttribution
  /** Stamped when `attribution` is present so reports can segment legacy rows. */
  attributionVersion?: AttributionVersion
  /** Raw namespaced concept label from the exercise (e.g. "grammar:present simple"). Canonicalized before SRS persistence/scheduling. */
  topic?: string
}

export type ExerciseResult = PracticeAnswer & { completedAt: Date }

export type SessionResult = {
  results: ExerciseResult[]
  /** Overall accuracy as a percentage (0-100). */
  accuracy: number
  totalTimeMs: number
  bySlug: Record<ExerciseSlug, { total: number; correct: number }>
}

// ── Daily plan (5-step "diaria") ────────────────────────────────────────────

export type DailyStepKind =
  | 'word_intro'       // presentación (noticing) de palabras nuevas antes de testearlas
  | 'word_review'      // SRS de word_bank (fill_blank / sentence_dictation / reorder)
  | 'context_practice'   // sentence_context desde word_bank (vocabulario en contexto de oración)
  | 'connected_speech'   // quiz + dictado desde mazos cs-*.json (habla conectada americana)
  | 'phoneme_focus'      // tanda mixta de un sonido (débil si hay progreso, si no del seed)
  | 'minimal_pairs'    // discriminación de pares mínimos
  | 'listening'        // dictation desde words del seed
  | 'sentence_builder' // reorder_words desde text_fragments (lecciones y grammar decks)
  | 'false_friends'    // elección en contexto entre un falso amigo y la palabra correcta
  | 'concept'          // mini-lección / language concept del día (lectura ligera)
  | 'study_deck'       // lección de la ruta, elegida desde el progreso del usuario
  | 'reader'           // comprehensible-input: párrafo i+1 que recicla vocab reciente
  | 'mission'          // transferencia oral con target/source/step exactos
  | 'grammar_focus'    // regla + producción restringida desde un mazo de gramática

export type DailySelectionReason =
  | 'due'
  | 'verification_due'
  | 'recent_error'
  | 'weak_target'
  | 'route_next'
  | 'saved_intent'
  | 'variety'

export interface DailySelectionMetadata {
  reason: DailySelectionReason
  targetRefs: string[]
  source: string
  requiredCapability?: 'network' | 'microphone' | 'speech_recognition'
}

export type DailyStep = {
  kind: DailyStepKind
  /** Stable id within a plan (used as React key and to mark completion). */
  id: string
  title: string
  subtitle: string
  /** Icon name (Tabler via @/components/icons). */
  icon: string
  /** Ejercicios context='daily' que componen el paso. Vacío para 'concept' y 'word_intro'. */
  exercises: PracticeExercise[]
  estMinutes: number
  /** Solo para 'word_intro': tarjetas de presentación (no evaluadas, no escriben answer_history). */
  studyCards?: StudyCardModel[]
  /** Solo para 'concept' y 'study_deck': a dónde lleva la lectura. */
  href?: string
  /** Solo para 'phoneme_focus': IPA del sonido que se practica (para mostrar intro). */
  ipa?: string
  /** Solo para 'reader': el párrafo de comprehensible input a leer. */
  readerPassage?: ReaderPassage
  /** Palabras ancla del paso (vocab/reader) para el hilo entre pasos. */
  featuredWords?: string[]
  /** Solo para 'false_friends': pares que se presentan antes de practicarlos. */
  falseFriends?: FalseFriendIntro[]
  /** Auditable selection provenance; absent only on cached legacy plans. */
  selection?: DailySelectionMetadata
  /** Exact oral handoff for mission steps. */
  missionLaunch?: MissionLaunch
  /** Unscored shadowing phrases played before the step's first free production. */
  warmupPhrases?: WarmupShadowPhrase[]
  /** Solo para 'grammar_focus': regla mostrada antes de los ejercicios de producción del paso. */
  grammarRule?: {
    deckSlug: string
    title: string
    goal: string
    /** Dos o tres filas `key: value` tomadas del bloque de reglas del mazo. */
    rows: Array<{ key: string; value: string }>
  }
}

/** Narrative framing metadata for a daily session (opening banner + closing recap). */
export type SessionArc = {
  /** Dominant grammar concept of the session, via dominantTopicLabel(). null if none. */
  topicLabel: string | null
  /** IPA of the day's primary sound. null if no phonetic focus. */
  soundIpa: string | null
  /** Distinct words touched in the session (from word_intro/word_review/context steps). */
  sessionWords: string[]
}

export type DailyPlan = {
  /** Exactamente DAILY_PLAN_STEP_COUNT pasos cuando el seed está disponible. */
  steps: DailyStep[]
  totalExercises: number
  /** true si no había word_bank ni progreso de fonema (todo salió del seed). */
  isNewUser: boolean
  /** Narrative framing for opening banner + closing recap. Optional: cached plans predate it. */
  arc?: SessionArc
}

export type PracticeSubmitHandler = (
  isCorrect: boolean,
  userAnswer: string,
  extras?: PracticeSubmitExtras,
) => void | Promise<void>

export type PedagogicalFeedback = {
  immediate: string
  explanation?: string
  correction?: string
  tip?: string
  example?: string
  expectedAnswer?: string
  category?: string
  errorCode?: ExerciseErrorCode
  canRetry?: boolean
  nextAction?: 'continue' | 'retry' | 'review_hint'
}

export type PracticeSubmitExtras = {
  score?: number
  feedback?: PedagogicalFeedback
  status?: PracticeResultStatus
  responseTimeMs?: number
  totalInteractionMs?: number
  firstTryFailed?: boolean
}

export type PracticeConfig = {
  context: PracticeContext
  exercises: PracticeExercise[]
  /** Default: 5. */
  sessionLength?: number
  /** IPA badge in focus chrome (Sound Lab). */
  soundIpa?: string
  /** Text badge when there is no single IPA (daily, review). */
  sessionLabel?: string
  onSessionComplete: (results: SessionResult) => void
  /** Optional: called when user taps "Terminar" on the summary. */
  onExit?: (results: SessionResult) => void
  /**
   * When provided, the session is persisted to Dexie under
   * `${userId}:${soundId}` and restored on remount. Omit to keep the
   * session purely in-memory.
   */
  persistence?: {
    userId: string
    soundId: number
  }
  /** Optional footer rendered inside the focus shell (e.g. "Ver lección" button). */
  footer?: React.ReactNode
  /** Start at this exercise index (0-based). Undefined = start from 0. */
  initialIndex?: number
}
