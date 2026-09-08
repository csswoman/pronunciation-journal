import type { FocusLevel } from '@/lib/learning-focus/types'
import type { GenericExercise } from '@/lib/exercises/types'

// ── Gaps ──────────────────────────────────────────────────────────────────────

export type GapKind = 'grammar' | 'phoneme' | 'vocabulary'

/** Un gap concreto que el usuario quiere cerrar en un sprint. */
export type SprintGap = {
  /** Categoría del gap. */
  kind: GapKind
  /**
   * Identidad canónica del target:
   * - grammar/vocabulary → topicId normalizado (ej. "simple-past")
   * - phoneme → PronunciationTargetId (ej. "vowel:/ɪ/")
   */
  targetId: string
  /** Etiqueta legible para el usuario (ej. "Simple Past", "/ɪ/ vs /iː/"). */
  label: string
  /** Nivel CEFR del gap. */
  level: FocusLevel
}

// ── Sprint ─────────────────────────────────────────────────────────────────────

export type SprintStatus = 'active' | 'completed' | 'expired'

/** Sesión de foco de 7 días con 1-2 gaps declarados. */
export type FocusSprint = {
  id: string
  gaps: SprintGap[]
  startsAt: string  // ISO
  endsAt: string    // ISO — startsAt + 7 días
  status: SprintStatus
  createdAt: string // ISO
}

// ── Content bodies por kind ───────────────────────────────────────────────────

/**
 * Mini-historia de 200-250 palabras que satura el gap en contexto real.
 * keyPhrases son las cadenas exactas del texto que ejemplifican el gap
 * (usadas para resaltado en el visor).
 */
export type StoryBody = {
  title: string
  passage: string
  explanation: string   // microexplicación del gap: qué es, cuándo va, ejemplo (3 líneas)
  keyPhrases: string[]  // fragmentos del texto que contienen el patrón
}

/**
 * 8-10 oraciones que saturan el patrón con variación contextual.
 * translation: ES para ejercicios de traducción ES→EN.
 * gapWord: la palabra/forma que ejemplifica el gap en esa oración.
 */
export type DrillSentence = {
  text: string
  translation: string
  gapWord: string
}

export type DrillBody = {
  sentences: DrillSentence[]
}

/** Diálogo de 12-16 turnos con el gap presente de forma natural. */
export type DialogueTurn = {
  speaker: 'A' | 'B'
  text: string
}

export type DialogueBody = {
  context: string     // situación en 1 oración
  turns: DialogueTurn[]
}

/**
 * 5 oraciones: 3 correctas, 2 con el error típico del gap.
 * El usuario identifica cuáles tienen error.
 */
export type ErrorTrapSentence = {
  text: string
  hasError: boolean
  correction?: string   // versión corregida (solo si hasError)
  explanation?: string  // por qué es incorrecto (solo si hasError)
}

export type ErrorTrapBody = {
  sentences: ErrorTrapSentence[]
}

/**
 * Letra de 16 líneas con el patrón repetido de forma natural.
 * gapLines: índices de las líneas que contienen el patrón.
 */
export type SongBody = {
  title: string
  lyrics: string      // 16 líneas separadas por \n
  gapLines: number[]  // índices 0-based de las líneas con el patrón
  notes: string       // qué buscar/notar (1-2 oraciones)
}

export type FocusContentBody =
  | StoryBody
  | DrillBody
  | DialogueBody
  | ErrorTrapBody
  | SongBody

// ── Media (subida manualmente desde Supabase dashboard) ───────────────────────

export type FocusMediaUrls = {
  audioNarrationUrl: string | null
  audioSentencesUrls: string[]    // 1:1 con sentences del drill, vacío si no aplica
  imageSceneUrl: string | null
  imagePromptUrl: string | null
  videoClipUrl: string | null
}

// ── Content ───────────────────────────────────────────────────────────────────

export type FocusContentKind = 'story' | 'drill' | 'dialogue' | 'error_trap' | 'song'

/** Asset de contenido generado por Gemini para un sprint. */
export type FocusContent = {
  id: string
  sprintId: string
  kind: FocusContentKind
  gapIds: string[]
  body: FocusContentBody
  exercises: GenericExercise[]
  media: FocusMediaUrls
  createdAt: string // ISO
}

// ── Type guards ───────────────────────────────────────────────────────────────

export function isStoryBody(body: FocusContentBody): body is StoryBody {
  return 'passage' in body && 'keyPhrases' in body
}

export function isDrillBody(body: FocusContentBody): body is DrillBody {
  return 'sentences' in body && Array.isArray((body as DrillBody).sentences) &&
    (body as DrillBody).sentences.length > 0 &&
    'gapWord' in (body as DrillBody).sentences[0]
}

export function isDialogueBody(body: FocusContentBody): body is DialogueBody {
  return 'turns' in body
}

export function isErrorTrapBody(body: FocusContentBody): body is ErrorTrapBody {
  return 'sentences' in body && Array.isArray((body as ErrorTrapBody).sentences) &&
    (body as ErrorTrapBody).sentences.length > 0 &&
    'hasError' in (body as ErrorTrapBody).sentences[0]
}

export function isSongBody(body: FocusContentBody): body is SongBody {
  return 'lyrics' in body && 'gapLines' in body
}
