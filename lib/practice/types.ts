import type { CEFRLevel } from '@/lib/exercises/cefr'
import type { Option } from '@/lib/phoneme-practice/types'
import type {
  ExerciseSourceRef,
  GenericExercise,
} from '@/lib/exercises/types'

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

export const EXERCISE_TYPE_IDS: Record<ExerciseSlug, number> = {
  pick_word: 1,
  pick_sound: 2,
  minimal_pair: 3,
  dictation: 4,
  fill_blank: 5,
  sentence_dictation: 6,
  match_pairs: 7,
  reorder_words: 8,
  speak_word: 10,
}

export type PracticeContext = 'sound_lab' | 'courses' | 'ai_coach' | 'practice' | 'daily'

export type PhonemePayload = {
  kind: 'phoneme'
  ipa: string
  targetWord?: string
  options: Option[]
  correctIds: string[]
}

export type GenericPayload = {
  kind: 'generic'
  data: GenericExercise
}

export type PracticeExercise = {
  /** Deterministic id used to dedupe within a session. */
  id: string
  slug: ExerciseSlug
  /** FK to `exercise_types.id`. */
  exerciseTypeId: number
  /** What was practiced (word slug, lesson id, soundId stringified, etc.). */
  contentId: string
  context: PracticeContext
  payload: PhonemePayload | GenericPayload
  level?: CEFRLevel
  /** Only set for phoneme-domain exercises. */
  soundId?: number
  /** Only set for generic exercises. */
  sourceRef?: ExerciseSourceRef
}

export type PracticeAnswer = {
  exerciseId: string
  slug: ExerciseSlug
  exerciseTypeId: number
  isCorrect: boolean
  userAnswer?: string
  timeMs: number
  /** 0-100, currently used by speak_word. */
  score?: number
  contentId: string
  context: PracticeContext
  /** Forwarded to `answer_history.sound_id` for phoneme exercises. */
  soundId?: number
  exercisePayload?: unknown
  /** Carried from PracticeExercise; used to build a prefixed content_id for SRS routing. */
  sourceRef?: ExerciseSourceRef
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
  | 'word_review'      // SRS de word_bank (fill_blank / sentence_dictation / reorder)
  | 'phoneme_focus'    // tanda mixta de un sonido (débil si hay progreso, si no del seed)
  | 'minimal_pairs'    // discriminación de pares mínimos
  | 'listening'        // dictation desde words del seed
  | 'sentence_builder' // reorder_words desde text_fragments (lecciones y grammar decks)
  | 'concept'          // mini-lección / language concept del día (lectura ligera)

export type DailyStep = {
  kind: DailyStepKind
  /** Stable id within a plan (used as React key and to mark completion). */
  id: string
  title: string
  subtitle: string
  /** lucide-react icon name. */
  icon: string
  /** Ejercicios context='daily' que componen el paso. Vacío para 'concept'. */
  exercises: PracticeExercise[]
  estMinutes: number
  /** Solo para 'concept': a dónde lleva la lectura. */
  href?: string
}

export type DailyPlan = {
  /** Exactamente DAILY_PLAN_STEP_COUNT pasos cuando el seed está disponible. */
  steps: DailyStep[]
  totalExercises: number
  /** true si no había word_bank ni progreso de fonema (todo salió del seed). */
  isNewUser: boolean
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
}
