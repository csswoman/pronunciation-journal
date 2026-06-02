import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { generateFillBlankFromWordBank } from '@/lib/exercises/generators/fill-blank'
import { generateSentenceDictationFromWordBank } from '@/lib/exercises/generators/sentence-dictation'
import { generateReorderWordsFromWordBank } from '@/lib/exercises/generators/reorder-words'
import { fetchTextFragments, generateReorderFromFragments } from '@/lib/exercises/generators/reorder-from-fragments'
import { generateMinimalPair, generateDictation } from '@/lib/phoneme-practice/exercises'
import { getAllSounds, getAllWords, getMinimalPairs, getWordsBySound } from '@/lib/phoneme-practice/queries'
import { buildMixedSession, type MixedExercise } from '@/lib/phoneme-practice/mixed-session'
import { fromGenericExercise, fromMixedExercise } from './adapters'
import type { DailyPlan, DailyStep, PracticeExercise } from './types'
import type { WordBankEntry } from '@/lib/word-bank/types'
import type { Sound, SoundWord, MinimalPair, UserSoundProgressWithSound } from '@/lib/phoneme-practice/types'

// ── Composition constants (tweak without refactoring) ────────────────────────

/** Cuántos pasos tiene la diaria. */
export const DAILY_PLAN_STEP_COUNT = 5

/** Cuántas palabras del word_bank intentamos traer para el paso de repaso. */
export const WORD_REVIEW_WORD_COUNT = 6

/** Ejercicios por paso de práctica (fonema, minimal pairs, listening). */
export const PHONEME_FOCUS_EXERCISE_COUNT = 4
export const MINIMAL_PAIRS_EXERCISE_COUNT = 3
export const LISTENING_EXERCISE_COUNT = 3

// ── Errors ────────────────────────────────────────────────────────────────────

/**
 * Conservada por compatibilidad con callers antiguos. `buildDailyPlan` ya NO
 * la lanza: el plan siempre se rellena desde el catálogo sembrado.
 */
export class EmptyWordBankError extends Error {
  readonly code = 'EMPTY_WORD_BANK'
  constructor() {
    super('No words in your word bank yet. Add some words from the Lexicon to start practicing.')
  }
}

// ── Pure helpers ──────────────────────────────────────────────────────────────

/** Día del año (1-366) usado para rotar la selección de contenido por día. */
function dayOfYear(now = new Date()): number {
  const start = new Date(now.getFullYear(), 0, 0)
  return Math.floor((now.getTime() - start.getTime()) / 86_400_000)
}

function dedupeByContentId(exercises: PracticeExercise[]): PracticeExercise[] {
  const seen = new Set<string>()
  return exercises.filter((ex) => {
    if (seen.has(ex.contentId)) return false
    seen.add(ex.contentId)
    return true
  })
}

/**
 * Elige un sonido del seed de forma determinista por día, evitando el sonido
 * ya usado por el paso de fonema débil. Prioriza sonidos fáciles primero
 * (difficulty bajo) para que el usuario nuevo no se frustre.
 */
function pickSeedSound(allSounds: Sound[], offset: number, excludeId?: number): Sound | null {
  const pool = allSounds.filter((s) => s.id !== excludeId)
  if (pool.length === 0) return null
  const ranked = [...pool].sort((a, b) => (a.difficulty ?? 9) - (b.difficulty ?? 9))
  // Rotamos dentro de la mitad más fácil para variar sin saltar a sonidos duros.
  const window = Math.max(1, Math.ceil(ranked.length / 2))
  return ranked[(dayOfYear() + offset) % window]
}

// ── Word bank fetchers (sin cambios respecto a la versión previa) ─────────────

async function fetchDueWords(userId: string): Promise<WordBankEntry[]> {
  const supabase = getSupabaseBrowserClient()
  const today = new Date().toISOString()

  const { data, error } = await supabase
    .from('word_bank')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'ready')
    .or(`srs_status.eq.new,next_review_at.lte.${today}`)
    .order('next_review_at', { ascending: true, nullsFirst: true })
    .limit(WORD_REVIEW_WORD_COUNT)

  if (error) throw error
  return (data ?? []) as WordBankEntry[]
}

async function fetchNewWords(userId: string, limit: number): Promise<WordBankEntry[]> {
  if (limit <= 0) return []
  const supabase = getSupabaseBrowserClient()

  const { data, error } = await supabase
    .from('word_bank')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'ready')
    .eq('srs_status', 'new')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data ?? []) as WordBankEntry[]
}

async function fetchWeakestSoundProgress(userId: string): Promise<UserSoundProgressWithSound | null> {
  const supabase = getSupabaseBrowserClient()

  const { data, error } = await supabase
    .from('user_sound_progress')
    .select('*, sounds(*)')
    .eq('user_id', userId)
    .neq('status', 'locked')
    .neq('status', 'mastered')
    .gt('total_attempts', 0)

  if (error) throw error
  if (!data || data.length === 0) return null

  const ranked = (data as UserSoundProgressWithSound[]).sort((a, b) => {
    const accA = a.correct_answers / a.total_attempts
    const accB = b.correct_answers / b.total_attempts
    if (accA !== accB) return accA - accB
    return a.total_attempts - b.total_attempts
  })

  return ranked[0]
}

// ── Step builders ─────────────────────────────────────────────────────────────

/** Paso de repaso de palabras (solo si hay entradas en el word_bank). */
function buildWordReviewStep(words: WordBankEntry[]): DailyStep | null {
  if (words.length === 0) return null

  const fillBlanks = generateFillBlankFromWordBank(words, 2)
  const dictations = generateSentenceDictationFromWordBank(words, 2)
  const reorders = generateReorderWordsFromWordBank(words, 1)

  const exercises = dedupeByContentId([
    ...fillBlanks.map((ex) => fromGenericExercise(ex, 'daily')),
    ...dictations.map((ex) => fromGenericExercise(ex, 'daily')),
    ...reorders.map((ex) => fromGenericExercise(ex, 'daily')),
  ])

  if (exercises.length === 0) return null

  return {
    kind: 'word_review',
    id: 'word_review',
    title: 'Repaso de palabras',
    subtitle: `${words.length} ${words.length === 1 ? 'palabra' : 'palabras'} de tu léxico`,
    icon: 'BookMarked',
    exercises,
    estMinutes: Math.max(2, Math.round(exercises.length * 1.1)),
  }
}

/**
 * Paso de práctica de fonema. Reusa buildMixedSession para un sonido (débil o
 * del seed) y se queda con un subconjunto de ejercicios "core" (sin minimal
 * pairs, que tienen su propio paso).
 */
function buildPhonemeFocusStep(
  sound: Sound,
  targetWords: SoundWord[],
  allSounds: Sound[],
  allWordsBySoundId: Map<number, SoundWord[]>,
  pairs: MinimalPair[],
  isWeak: boolean,
): DailyStep | null {
  const mixed = buildMixedSession(sound, targetWords, allSounds, allWordsBySoundId, pairs)
  const core = mixed.filter((ex: MixedExercise) => !(ex.kind === 'phoneme' && ex.data.type === 'minimal_pair'))
  const exercises = dedupeByContentId(
    core.slice(0, PHONEME_FOCUS_EXERCISE_COUNT).map((ex) => fromMixedExercise(ex, 'daily')),
  )

  if (exercises.length === 0) return null

  return {
    kind: 'phoneme_focus',
    id: `phoneme_focus:${sound.id}`,
    title: `Sonido ${sound.ipa}`,
    subtitle: isWeak ? 'Tu sonido a reforzar hoy' : `Practica el sonido como en “${sound.example}”`,
    icon: 'Waves',
    exercises,
    estMinutes: Math.max(2, Math.round(exercises.length * 1.1)),
  }
}

/** Paso de pares mínimos (solo si el sonido tiene pares en el seed). */
function buildMinimalPairsStep(sound: Sound, pairs: MinimalPair[]): DailyStep | null {
  if (pairs.length === 0) return null

  const exercises: PracticeExercise[] = []
  for (let i = 0; i < MINIMAL_PAIRS_EXERCISE_COUNT; i++) {
    const mp = generateMinimalPair(sound, pairs)
    if (mp.options.length === 0) continue
    exercises.push(fromMixedExercise({ kind: 'phoneme', data: mp }, 'daily'))
  }

  const deduped = dedupeByContentId(exercises)
  if (deduped.length === 0) return null

  return {
    kind: 'minimal_pairs',
    id: `minimal_pairs:${sound.id}`,
    title: 'Pares mínimos',
    subtitle: `Distingue ${sound.ipa} de sonidos parecidos`,
    icon: 'GitCompareArrows',
    exercises: deduped,
    estMinutes: Math.max(2, Math.round(deduped.length * 1.1)),
  }
}

/** Paso de escucha/dictado desde palabras del seed. */
function buildListeningStep(sound: Sound, words: SoundWord[]): DailyStep | null {
  if (words.length === 0) return null

  const exercises: PracticeExercise[] = []
  for (let i = 0; i < LISTENING_EXERCISE_COUNT; i++) {
    const dict = generateDictation(sound, words)
    if (!dict.targetWord) continue
    exercises.push(fromMixedExercise({ kind: 'phoneme', data: dict }, 'daily'))
  }

  const deduped = dedupeByContentId(exercises)
  if (deduped.length === 0) return null

  return {
    kind: 'listening',
    id: `listening:${sound.id}`,
    title: 'Escucha y escribe',
    subtitle: 'Dictado de palabras nuevas',
    icon: 'Headphones',
    exercises: deduped,
    estMinutes: Math.max(2, Math.round(deduped.length * 1.1)),
  }
}

// ── Sentence builder step ─────────────────────────────────────────────────────

export const SENTENCE_BUILDER_EXERCISE_COUNT = 5

/**
 * Paso de construcción de oraciones: reorder_words desde text_fragments.
 * Rota fuente entre lecciones y grammar-decks para mantener variedad.
 */
async function buildSentenceBuilderStep(
  source: string | null = null,
): Promise<DailyStep | null> {
  const fragments = await fetchTextFragments(source, 60)
  const exercises = dedupeByContentId(
    generateReorderFromFragments(fragments, SENTENCE_BUILDER_EXERCISE_COUNT).map((ex) =>
      fromGenericExercise(ex, 'daily'),
    ),
  )
  if (exercises.length === 0) return null

  return {
    kind: 'sentence_builder',
    id: 'sentence_builder',
    title: 'Arma la oración',
    subtitle: 'Ordena palabras de tus lecciones',
    icon: 'LayoutList',
    exercises,
    estMinutes: Math.max(2, Math.round(exercises.length * 1.2)),
  }
}

// ── Review plan (SRS-due items only) ─────────────────────────────────────────

/** Palabras con SRS vencido (estado != new). Excluye palabras nuevas. */
async function fetchDueReviewWords(userId: string): Promise<WordBankEntry[]> {
  const supabase = getSupabaseBrowserClient()
  const today = new Date().toISOString()

  const { data, error } = await supabase
    .from('word_bank')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'ready')
    .neq('srs_status', 'new')
    .lte('next_review_at', today)
    .order('next_review_at', { ascending: true })
    .limit(WORD_REVIEW_WORD_COUNT)

  if (error) throw error
  return (data ?? []) as WordBankEntry[]
}

/** Fonemas con next_review vencido (excluye locked/mastered). */
async function fetchDueSounds(userId: string): Promise<UserSoundProgressWithSound[]> {
  const supabase = getSupabaseBrowserClient()
  const today = new Date().toISOString()

  const { data, error } = await supabase
    .from('user_sound_progress')
    .select('*, sounds(*)')
    .eq('user_id', userId)
    .neq('status', 'locked')
    .neq('status', 'mastered')
    .lte('next_review', today)
    .order('next_review', { ascending: true })
    .limit(2)

  if (error) throw error
  return (data ?? []) as unknown as UserSoundProgressWithSound[]
}

export type ReviewPlan = {
  steps: DailyStep[]
  totalExercises: number
  /** true si no hay nada pendiente de repasar hoy. */
  nothingDue: boolean
}

/**
 * Construye un plan de repaso SRS puro: solo palabras con next_review_at
 * vencido (srs_status != new) y fonemas con next_review vencido.
 * No solapa con buildDailyPlan (que solo toma palabras nuevas para word_review).
 */
export async function buildReviewPlan(userId: string): Promise<ReviewPlan> {
  const [reviewWords, dueSounds, allSounds, allWords] = await Promise.all([
    fetchDueReviewWords(userId),
    fetchDueSounds(userId),
    getAllSounds(),
    getAllWords(),
  ])

  const allWordsBySoundId = new Map<number, SoundWord[]>(
    allSounds.map((s) => [s.id, allWords.filter((w) => w.sound_id === s.id)]),
  )

  const steps: DailyStep[] = []

  const wordStep = buildWordReviewStep(reviewWords)
  if (wordStep) steps.push(wordStep)

  for (const progress of dueSounds) {
    const sound = progress.sounds as Sound
    const targetWords = allWordsBySoundId.get(sound.id) ?? []
    const pairs = await getMinimalPairs(sound.id)

    const focus = buildPhonemeFocusStep(sound, targetWords, allSounds, allWordsBySoundId, pairs, true)
    if (focus) steps.push({ ...focus, id: `review_sound:${sound.id}`, kind: 'phoneme_focus' })
  }

  // Incluir siempre sentence_builder en el repaso — refuerza construcción de frases.
  const sentenceStep = await buildSentenceBuilderStep(null)
  if (sentenceStep) steps.push(sentenceStep)

  const totalExercises = steps.reduce((sum, s) => sum + s.exercises.length, 0)

  return {
    steps,
    totalExercises,
    nothingDue: steps.length === 0,
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Construye la diaria de 5 pasos para un usuario.
 *
 * Prioridad de pasos:
 *   1. word_review   — si hay word_bank (due/new), si no se omite
 *   2. phoneme_focus — sonido débil (si hay progreso) o sonido fácil del seed
 *   3. minimal_pairs — pares del sonido elegido (si existen)
 *   4. listening     — dictado de palabras del seed
 *   5+ relleno con más phoneme_focus de otros sonidos del seed
 *
 * El paso `concept` (mini-lección del día) NO se genera aquí: es server-only y
 * lo inyecta la página/home. Si no se llega a 5 pasos jugables, se rellena con
 * sonidos del seed — que siempre están disponibles, así que el plan nunca queda
 * vacío. Por eso `buildDailyPlan` ya no lanza EmptyWordBankError.
 */
export async function buildDailyPlan(userId: string): Promise<DailyPlan> {
  // ── Catálogo del seed (siempre disponible) ────────────────────────────────
  const [allSounds, allWords] = await Promise.all([getAllSounds(), getAllWords()])
  const allWordsBySoundId = new Map<number, SoundWord[]>(
    allSounds.map((s) => [s.id, allWords.filter((w) => w.sound_id === s.id)]),
  )

  // ── 1. Word review: solo palabras NUEVAS (las vencidas van al plan de repaso) ─
  let reviewWords = await fetchNewWords(userId, WORD_REVIEW_WORD_COUNT)
  // Relleno con due si hay pocas nuevas (usuario sin palabras nuevas pendientes)
  if (reviewWords.length < WORD_REVIEW_WORD_COUNT) {
    const newIds = new Set(reviewWords.map((w) => w.id))
    const due = (await fetchDueWords(userId)).filter((w) => !newIds.has(w.id))
    reviewWords = [...reviewWords, ...due].slice(0, WORD_REVIEW_WORD_COUNT)
  }
  const hasWordBank = reviewWords.length > 0

  // ── 2. Sonido protagonista: débil si hay progreso, si no del seed ─────────
  const weakest = await fetchWeakestSoundProgress(userId)
  const hasProgress = weakest != null
  const primarySound = weakest?.sounds ?? pickSeedSound(allSounds, 0)

  const steps: DailyStep[] = []

  const wordReview = buildWordReviewStep(reviewWords)
  if (wordReview) steps.push(wordReview)

  if (primarySound) {
    const [targetWords, pairs] = await Promise.all([
      getWordsBySound(primarySound.id),
      getMinimalPairs(primarySound.id),
    ])

    const focus = buildPhonemeFocusStep(
      primarySound,
      targetWords,
      allSounds,
      allWordsBySoundId,
      pairs,
      hasProgress,
    )
    if (focus) steps.push(focus)

    const minimal = buildMinimalPairsStep(primarySound, pairs)
    if (minimal) steps.push(minimal)

    const listening = buildListeningStep(primarySound, targetWords)
    if (listening) steps.push(listening)
  }

  // ── 3. Sentence builder desde text_fragments (si hay espacio) ────────────
  if (steps.length < DAILY_PLAN_STEP_COUNT) {
    // Alterna entre lecciones y grammar-decks según el día para variar.
    const sentenceSource = dayOfYear() % 2 === 0 ? 'lesson' : 'grammar-deck'
    const sentenceStep = await buildSentenceBuilderStep(sentenceSource)
    if (sentenceStep) steps.push(sentenceStep)
  }

  // ── 4. Relleno hasta DAILY_PLAN_STEP_COUNT con sonidos extra del seed ─────
  let offset = 1
  const usedIds = new Set(steps.map((s) => s.id))
  while (steps.length < DAILY_PLAN_STEP_COUNT && offset <= allSounds.length) {
    const sound = pickSeedSound(allSounds, offset, primarySound?.id)
    offset++
    if (!sound) break

    const words = allWordsBySoundId.get(sound.id) ?? []
    if (words.length === 0) continue

    const focus = buildPhonemeFocusStep(sound, words, allSounds, allWordsBySoundId, [], false)
    if (focus && !usedIds.has(focus.id)) {
      steps.push(focus)
      usedIds.add(focus.id)
    }
  }

  const totalExercises = steps.reduce((sum, s) => sum + s.exercises.length, 0)

  return {
    steps: steps.slice(0, DAILY_PLAN_STEP_COUNT),
    totalExercises,
    isNewUser: !hasWordBank && !hasProgress,
  }
}
