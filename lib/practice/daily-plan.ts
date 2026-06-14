import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { generateFillBlankFromWordBank } from '@/lib/exercises/generators/fill-blank'
import { generateSentenceDictationFromWordBank } from '@/lib/exercises/generators/sentence-dictation'
import { generateReorderWordsFromWordBank } from '@/lib/exercises/generators/reorder-words'
import { generateMatchPairsFromWordBank } from '@/lib/exercises/generators/match-pairs'
import { generateSentenceContextExercises } from '@/lib/lexicon/exercises'
import { generateConnectedSpeechExercises } from '@/lib/exercises/generators/connected-speech'
import { deckSlugForWeakTopics } from './topic-decks'
import { db } from '@/lib/db'
import type { WordEntry } from '@/lib/lexicon/types'
import { fetchTextFragments, generateReorderFromFragments } from '@/lib/exercises/generators/reorder-from-fragments'
import { generateReorderAI } from '@/lib/exercises/generators/reorder-ai'
import { generateMinimalPair, generateDictation } from '@/lib/phoneme-practice/exercises'
import { getAllSounds, getAllWords, getMinimalPairs, getWordsBySound } from '@/lib/phoneme-practice/queries'
import { buildMixedSession, type MixedExercise } from '@/lib/phoneme-practice/mixed-session'
import { fetchCoreWordsForDay } from '@/lib/core-1000/client-fetch'
import { fromGenericExercise, fromMixedExercise } from './adapters'
import type { DailyPlan, DailyStep, PracticeExercise } from './types'
import type { WordBankEntry } from '@/lib/word-bank/types'
import type { Sound, SoundWord, MinimalPair } from '@/lib/phoneme-practice/types'

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
 * ya usado por el paso de fonema débil. Ordena por difficulty ascendente pero
 * rota por TODOS los sonidos — no solo la mitad fácil — de modo que /θ/, /ð/,
 * /ɜr/ y similares aparecen en la diaria con la misma frecuencia que los fáciles.
 * La ordenación por dificultad asegura que un usuario nuevo empiece por los
 * sonidos más accesibles los primeros días, pero llega a los difíciles
 * conforme avanza el año.
 */
function pickSeedSound(allSounds: Sound[], offset: number, excludeId?: number): Sound | null {
  const pool = allSounds.filter((s) => s.id !== excludeId)
  if (pool.length === 0) return null
  const ranked = [...pool].sort((a, b) => (a.difficulty ?? 9) - (b.difficulty ?? 9))
  return ranked[(dayOfYear() + offset) % ranked.length]
}

// ── Word bank fetchers (sin cambios respecto a la versión previa) ─────────────

async function fetchDueWords(userId: string): Promise<WordBankEntry[]> {
  const supabase = getSupabaseBrowserClient()
  const today = new Date().toISOString()

  const { data, error } = await supabase
    .from('word_bank')
    .select('id, user_id, text, meaning, translation, ipa, example, audio_url, difficulty, status, srs_status, next_review_at, ease_factor, interval_days, repetitions, review_count, last_reviewed_at, source, source_ref, created_at')
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
    .select('id, user_id, text, meaning, translation, ipa, example, audio_url, difficulty, status, srs_status, next_review_at, ease_factor, interval_days, repetitions, review_count, last_reviewed_at, source, source_ref, created_at')
    .eq('user_id', userId)
    .eq('status', 'ready')
    .eq('srs_status', 'new')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data ?? []) as WordBankEntry[]
}

/** Returns the Sound with the weakest contrast accuracy, or null if no progress. */
async function fetchWeakestSoundProgress(userId: string): Promise<Sound | null> {
  const supabase = getSupabaseBrowserClient()

  const { data, error } = await supabase
    .from('user_contrast_progress')
    .select('contrast_id, total_attempts, correct_answers')
    .eq('user_id', userId)
    .gt('total_attempts', 0)

  // Table may not exist yet (PGRST205) — treat as no progress rather than crashing
  if (error) return null
  if (!data || data.length === 0) return null

  // Find IPA with lowest accuracy across its contrast rows.
  // Each contrast_id encodes TWO phonemes (ipaA|ipaB) — count errors toward both,
  // since a /s/-/z/ confusion is equally a /z/ weakness as it is a /s/ weakness.
  const byIpa = new Map<string, { correct: number; total: number }>()
  for (const r of data) {
    for (const ipa of r.contrast_id.split('|')) {
      const prev = byIpa.get(ipa) ?? { correct: 0, total: 0 }
      byIpa.set(ipa, { correct: prev.correct + r.correct_answers, total: prev.total + r.total_attempts })
    }
  }

  const weakestIpa = [...byIpa.entries()]
    .sort((a, b) => (a[1].correct / a[1].total) - (b[1].correct / b[1].total))[0]?.[0]

  if (!weakestIpa) return null

  const { data: soundRows } = await supabase
    .from('sounds')
    .select('id, ipa, example, category, type, difficulty')
    .eq('ipa', weakestIpa)
    .limit(1)

  return (soundRows?.[0] as Sound | undefined) ?? null
}

// ── Step builders ─────────────────────────────────────────────────────────────

/** Paso de repaso de palabras (solo si hay entradas en el word_bank). */
function buildWordReviewStep(words: WordBankEntry[]): DailyStep | null {
  if (words.length === 0) return null

  const fillBlanks = generateFillBlankFromWordBank(words, 2)
  const dictations = generateSentenceDictationFromWordBank(words, 2)
  const reorders = generateReorderWordsFromWordBank(words, 1)
  const matchPairs = generateMatchPairsFromWordBank(words, 1)

  const exercises = dedupeByContentId([
    ...fillBlanks.map((ex) => fromGenericExercise(ex, 'daily')),
    ...dictations.map((ex) => fromGenericExercise(ex, 'daily')),
    ...reorders.map((ex) => fromGenericExercise(ex, 'daily')),
    ...matchPairs.map((ex) => fromGenericExercise(ex, 'daily')),
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

/** Adapts WordBankEntry to the WordEntry shape expected by generateSentenceContextExercises. */
function toWordEntry(entry: WordBankEntry): WordEntry {
  return {
    id: entry.id,
    word: entry.text,
    pos: 'n',
    definition: entry.meaning ?? '',
    ipa: entry.ipa ?? undefined,
    translation: entry.translation ?? undefined,
    difficulty: (entry.difficulty ?? 2) as 1 | 2 | 3,
    tags: [],
    exampleSentence: entry.example ?? undefined,
  }
}

/**
 * Paso de práctica en contexto: sentence_context desde word_bank.
 * Solo se genera si hay ≥2 palabras con oraciones de ejemplo.
 */
function buildContextPracticeStep(words: WordBankEntry[]): DailyStep | null {
  const wordEntries = words.map(toWordEntry)
  const usable = wordEntries.filter((w) => w.exampleSentence)
  if (usable.length < 2) return null

  const contextExercises = generateSentenceContextExercises(usable, wordEntries)
  const exercises = dedupeByContentId(
    contextExercises.map((ex) => fromGenericExercise(ex, 'daily')),
  )
  if (exercises.length === 0) return null

  return {
    kind: 'context_practice',
    id: 'context_practice',
    title: 'Práctica en contexto',
    subtitle: `${exercises.length} ${exercises.length === 1 ? 'palabra' : 'palabras'} en oraciones reales`,
    icon: 'FileText',
    exercises,
    estMinutes: Math.max(2, Math.round(exercises.length * 1.2)),
  }
}

/**
 * Paso de habla conectada: quiz + dictado desde los decks cs-*.json.
 * Solo aparece cuando dayOfYear() es par y el deck está disponible (online).
 * Si el fetch falla (offline sin caché) devuelve null — la diaria no se rompe.
 */
async function buildConnectedSpeechStep(): Promise<DailyStep | null> {
  if (dayOfYear() % 2 !== 0) return null

  const result = await generateConnectedSpeechExercises(2, 2)
  if (!result) return null

  const exercises = dedupeByContentId([
    ...result.quiz.map((ex) => fromGenericExercise(ex, 'daily')),
    ...result.dictation.map((ex) => fromGenericExercise(ex, 'daily')),
  ])
  if (exercises.length === 0) return null

  return {
    kind: 'connected_speech',
    id: 'connected_speech',
    title: 'Connected speech',
    subtitle: 'How Americans really sound',
    icon: 'AudioWaveform',
    exercises,
    estMinutes: Math.max(2, Math.round(exercises.length * 1.2)),
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
    title: `Sound ${sound.ipa}`,
    subtitle: isWeak ? 'Your sound to strengthen today' : `Practice the sound as in “${sound.example}”`,
    icon: 'Waves',
    exercises,
    estMinutes: Math.max(2, Math.round(exercises.length * 1.1)),
    ipa: sound.ipa,
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
    title: 'Minimal pairs',
    subtitle: `Tell ${sound.ipa} apart from similar sounds`,
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
    title: 'Listen and write',
    subtitle: 'Dictation with new words',
    icon: 'Headphones',
    exercises: deduped,
    estMinutes: Math.max(2, Math.round(deduped.length * 1.1)),
  }
}

// ── Sentence builder step ─────────────────────────────────────────────────────

export const SENTENCE_BUILDER_EXERCISE_COUNT = 5

/**
 * Paso de construcción de oraciones: reorder_words desde text_fragments.
 * Si se proporciona weakTopic, intenta enriquecer con oraciones generadas por IA
 * (requiere red); en caso de fallo cae al generador estático.
 */
async function buildSentenceBuilderStep(
  source: string | null = null,
  weakTopic?: string,
): Promise<DailyStep | null> {
  let exercises: ReturnType<typeof dedupeByContentId> = []

  if (weakTopic) {
    try {
      const aiExercises = await generateReorderAI(weakTopic, 'B1', SENTENCE_BUILDER_EXERCISE_COUNT, source ?? undefined)
      exercises = dedupeByContentId(aiExercises.map((ex) => fromGenericExercise(ex, 'daily')))
    } catch {
      // offline or auth missing — fall through to static generator
    }
  }

  if (exercises.length === 0) {
    const fragments = await fetchTextFragments(source, 60)
    exercises = dedupeByContentId(
      generateReorderFromFragments(fragments, SENTENCE_BUILDER_EXERCISE_COUNT).map((ex) =>
        fromGenericExercise(ex, 'daily'),
      ),
    )
  }

  if (exercises.length === 0) return null

  return {
    kind: 'sentence_builder',
    id: 'sentence_builder',
    title: 'Arma la oración',
    subtitle: weakTopic ? `Práctica: ${weakTopic}` : 'Ordena palabras de tus lecciones',
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
    .select('id, user_id, text, meaning, translation, ipa, example, audio_url, difficulty, status, srs_status, next_review_at, ease_factor, interval_days, repetitions, review_count, last_reviewed_at, source, source_ref, created_at')
    .eq('user_id', userId)
    .eq('status', 'ready')
    .neq('srs_status', 'new')
    .lte('next_review_at', today)
    .order('next_review_at', { ascending: true })
    .limit(WORD_REVIEW_WORD_COUNT)

  if (error) throw error
  return (data ?? []) as WordBankEntry[]
}

/** Sounds derived from due contrasts (next_review <= now). */
async function fetchDueSounds(userId: string): Promise<Sound[]> {
  const supabase = getSupabaseBrowserClient()
  const today = new Date().toISOString()

  const { data, error } = await supabase
    .from('user_contrast_progress')
    .select('contrast_id, next_review')
    .eq('user_id', userId)
    .or(`next_review.lte.${today},next_review.is.null`)
    .order('next_review', { ascending: true })
    .limit(4) // fetch a few extra since we dedupe by IPA

  if (error) return []

  // Collect unique IPAs from due contrasts, take up to 2 sounds
  const seen = new Set<string>()
  const ipas: string[] = []
  for (const r of data ?? []) {
    const [ipaA, ipaB] = r.contrast_id.split('|')
    for (const ipa of [ipaA, ipaB]) {
      if (!seen.has(ipa)) { seen.add(ipa); ipas.push(ipa) }
      if (ipas.length >= 2) break
    }
    if (ipas.length >= 2) break
  }

  if (ipas.length === 0) return []

  const { data: soundRows } = await supabase
    .from('sounds')
    .select('id, ipa, example, category, type, difficulty')
    .in('ipa', ipas)

  return (soundRows ?? []) as Sound[]
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

  const contextStep = buildContextPracticeStep(reviewWords)
  if (contextStep) steps.push(contextStep)

  for (const sound of dueSounds) {
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

  // Fallback: si el usuario no tiene palabras hoy, usar Core 1000
  if (reviewWords.length === 0) {
    reviewWords = await fetchCoreWordsForDay(dayOfYear(), WORD_REVIEW_WORD_COUNT)
  }

  // ── 2. Sonido protagonista: débil si hay progreso → coach → seed ─────────
  const [weakest, localLearningState] = await Promise.all([
    fetchWeakestSoundProgress(userId),
    db.learningState.get(userId).catch(() => null),
  ])
  const aiState = localLearningState?.state ?? null
  const hasProgress = weakest != null

  // Fallback: if Sound Lab shows no progress but AI Coach has struggling sounds,
  // resolve the weakest IPA against the seed catalog.
  let primarySound: Sound | null = weakest
  if (!primarySound && aiState) {
    const worstSound = [...(aiState.pronunciation.strugglingSounds ?? [])]
      .filter((s) => s.attempts >= 3 && s.avgAccuracy < 70)
      .sort((a, b) => a.avgAccuracy - b.avgAccuracy)[0]
    if (worstSound) {
      primarySound = allSounds.find((s) => s.ipa === worstSound.ipa) ?? null
    }
  }
  if (!primarySound) primarySound = pickSeedSound(allSounds, 0)

  const steps: DailyStep[] = []

  const wordReview = buildWordReviewStep(reviewWords)
  if (wordReview) steps.push(wordReview)

  const contextPractice = buildContextPracticeStep(reviewWords)
  if (contextPractice) steps.push(contextPractice)

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

  // ── 3. Connected speech (días pares) o sentence builder (días impares) ──────
  if (steps.length < DAILY_PLAN_STEP_COUNT) {
    const connectedStep = await buildConnectedSpeechStep()
    if (connectedStep) {
      steps.push(connectedStep)
    } else {
      const weakTopics = aiState?.grammar.weakTopics ?? []
      const weakDeckSlug = deckSlugForWeakTopics(weakTopics)
      const weakTopic = weakTopics.find((t) => t.errorRate > 0.4 && t.sampleCount >= 3)?.topic
      const sentenceSource = weakDeckSlug ?? (dayOfYear() % 2 === 0 ? 'lesson' : 'grammar-deck')
      const sentenceStep = await buildSentenceBuilderStep(sentenceSource, weakTopic)
      if (sentenceStep) steps.push(sentenceStep)
    }
  }

  // ── 4. Sentence builder si aún hay espacio (para días pares con connected speech) ─
  if (steps.length < DAILY_PLAN_STEP_COUNT) {
    const weakTopics = aiState?.grammar.weakTopics ?? []
    const weakDeckSlug = deckSlugForWeakTopics(weakTopics)
    const weakTopic = weakTopics.find((t) => t.errorRate > 0.4 && t.sampleCount >= 3)?.topic
    const sentenceSource = weakDeckSlug ?? (dayOfYear() % 2 === 0 ? 'lesson' : 'grammar-deck')
    const sentenceStep = await buildSentenceBuilderStep(sentenceSource, weakTopic)
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
