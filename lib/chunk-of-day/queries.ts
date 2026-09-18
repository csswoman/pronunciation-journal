import { db } from '@/lib/db'
import type { CEFRLevel } from '@/lib/exercises/cefr'
import { buildChunkExercises, filterChunksForLevel } from './exercises'
import { LEARNING_CHUNKS } from './catalog'
import { chunkSrsId } from './srs'
import { routePronunciationDifficulty } from './pronunciation-routing'
import { fromGenericExercise, fromMixedExercise } from '@/lib/practice/adapters'
import { getTarget } from '@/lib/pronunciation/targets/registry'
import { getSessionDataset } from '@/lib/phoneme-practice/queries'
import { generateMinimalPair } from '@/lib/phoneme-practice/exercises'
import { contrastKey } from '@/lib/phoneme-practice/phoneme-similarity'
import type { MinimalPair, Sound } from '@/lib/phoneme-practice/types'
import type { PronunciationTarget } from '@/lib/pronunciation/targets/types'
import type { LearningChunk } from './types'
import type { DailyStep, PracticeContext } from '@/lib/practice/types'

export interface ChunkPracticeSession {
  chunks: LearningChunk[]
  exercises: ReturnType<typeof buildChunkExercises>
}
function dailyRank(id: string): number {
  const seed = new Date().toISOString().slice(0, 10)
  let result = 0
  for (const char of `${seed}:${id}`) result = Math.imul(result ^ char.charCodeAt(0), 31)
  return result >>> 0
}

export function newChunkCountForDailyLoad(dueActionCount: number): 1 | 2 | 3 {
  if (dueActionCount >= 6) return 1
  if (dueActionCount >= 2) return 2
  return 3
}

/**
 * Selects a small communicative thread, not a random list: the first unseen
 * chunk determines the function/category and later chunks reinforce it.
 */
export function selectNewChunkThread(
  catalog: readonly LearningChunk[],
  seenIds: ReadonlySet<string>,
  limit: number,
): LearningChunk[] {
  const unseen = catalog.filter((chunk) => !seenIds.has(chunk.id))
    .sort((a, b) => dailyRank(a.id) - dailyRank(b.id))
  const first = unseen[0]
  if (!first) return []
  return [first, ...unseen.filter((chunk) =>
    chunk.id !== first.id
    && (chunk.learning.communicativeFunction === first.learning.communicativeFunction
      || chunk.category === first.category),
  )].slice(0, limit)
}

function chunkFeaturedWords(chunks: readonly LearningChunk[]): string[] {
  return chunks.flatMap((chunk) => chunk.contentGraph.highlights
    .map((highlight) => chunk.contentGraph.text.slice(highlight.start, highlight.end).toLowerCase()))
}

/** Uses STT feedback only when a route names an extant authored target. */
export function buildPronunciationRouteExercises(
  chunks: readonly LearningChunk[],
  pronunciationTargetIds: readonly string[],
  learnerLevel: CEFRLevel,
) {
  const exercises = buildChunkExercises(chunks, LEARNING_CHUNKS, 'daily', learnerLevel)
  const target = pronunciationTargetIds.map(getTarget).find((result) => result.ok)
  const chunk = chunks[0]
  if (!target || !chunk) return exercises
  const shadow = fromGenericExercise({
    id: `chunk:${chunk.id}:pronunciation-shadow:${target.target.id}`,
    type: 'cs_shadow_phrase',
    sourceRef: { source: 'chunks', id: chunk.id },
    level: chunk.learning.cefr,
    phrase: chunk.chunk,
    ...(chunk.ipa ? { phraseIpa: chunk.ipa } : {}),
    deckSlug: 'chunk-pronunciation-route',
    pronunciationTargetId: target.target.id,
  }, 'daily')
  // Shadowing starts with its Listen control; avoid a duplicate speech prompt.
  return [shadow, ...exercises.filter((exercise) => exercise.slug !== 'spoken_production')]
}

function registeredContrastTarget(pronunciationTargetIds: readonly string[]): PronunciationTarget | null {
  for (const id of pronunciationTargetIds) {
    const result = getTarget(id)
    if (result.ok && result.target.contrastPair) return result.target
  }
  return null
}

/**
 * Builds one perception trial only from a registered contrast plus its
 * canonical sound dataset. Missing/offline data returns null, never a made-up
 * pair or a false perception signal.
 */
export function buildContrastDiscriminationExercise(
  pronunciationTargetIds: readonly string[],
  sounds: readonly Sound[],
  pairsForSound: readonly MinimalPair[],
) {
  const target = registeredContrastTarget(pronunciationTargetIds)
  if (!target?.contrastPair) return null
  const [ipaA, ipaB] = target.contrastPair
  const sound = sounds.find((candidate) => candidate.ipa === ipaA || candidate.ipa === ipaB)
  if (!sound) return null
  const minimalPair = generateMinimalPair(sound, [...pairsForSound])
  if (minimalPair.options.length === 0) return null
  return fromMixedExercise({
    kind: 'phoneme',
    data: { ...minimalPair, contrastId: contrastKey(ipaA, ipaB) },
  }, 'daily')
}

async function loadContrastDiscriminationExercise(
  pronunciationTargetIds: readonly string[],
  sounds: readonly Sound[] | undefined,
) {
  const target = registeredContrastTarget(pronunciationTargetIds)
  if (!target?.contrastPair || !sounds) return null
  const [ipaA, ipaB] = target.contrastPair
  const sound = sounds.find((candidate) => candidate.ipa === ipaA || candidate.ipa === ipaB)
  if (!sound) return null
  const dataset = await getSessionDataset(sound.id)
  return buildContrastDiscriminationExercise(pronunciationTargetIds, sounds, dataset.minimalPairs)
}

function buildChunkIntroStep(chunks: LearningChunk[], learnerLevel: CEFRLevel): DailyStep | null {
  if (chunks.length === 0) return null
  return {
    kind: 'chunk_intro',
    id: `intro_chunks:${chunks.map((chunk) => chunk.id).join(',')}`,
    title: 'Incorpora expresiones para usar hoy',
    subtitle: 'Primero reconoce la situación; después escucha y responde con la expresión.',
    icon: 'Messages',
    exercises: buildChunkExercises(chunks, LEARNING_CHUNKS, 'daily', learnerLevel),
    estMinutes: 5,
    chunks,
    featuredWords: chunkFeaturedWords(chunks),
  }
}

const CEFR_ORDER: readonly CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

/**
 * Pool de chunks del nivel, ampliado al siguiente nivel cuando el actual ya no
 * tiene material sin ver.
 *
 * Con 36 chunks A1 en el catálogo, un alumno constante agota su nivel en
 * semanas. Sin esta ampliación `selectNewChunkThread` devolvía `[]` y el plan
 * se quedaba sin contenido nuevo en silencio: el slot reservado volvía al pool
 * general y la sesión pasaba a ser 100% repaso sin decir por qué.
 */
export function chunkPoolForLevel(
  catalog: readonly LearningChunk[],
  level: CEFRLevel,
  seenIds: ReadonlySet<string>,
): LearningChunk[] {
  for (let index = CEFR_ORDER.indexOf(level); index < CEFR_ORDER.length; index++) {
    const pool = filterChunksForLevel(catalog, CEFR_ORDER[index])
    if (pool.some((chunk) => !seenIds.has(chunk.id))) return pool
  }
  return filterChunksForLevel(catalog, CEFR_ORDER[CEFR_ORDER.length - 1])
}

export async function loadDailyChunkIntroStep(
  userId: string,
  level: CEFRLevel,
  dueActionCount: number,
): Promise<DailyStep | null> {
  const rows = await db.srsData.where('userId').equals(userId).toArray()
  const seenIds = new Set(rows.filter((row) => row.wordId.startsWith('chunk:'))
    .map((row) => row.wordId.slice('chunk:'.length)))
  const eligible = chunkPoolForLevel(LEARNING_CHUNKS, level, seenIds)
  return buildChunkIntroStep(selectNewChunkThread(
    eligible,
    seenIds,
    newChunkCountForDailyLoad(dueActionCount),
  ), level)
}

/** Offers one authored listen → recall → production route per difficulty signal. */
export async function loadPronunciationDifficultyChunkStep(
  userId: string,
  learnerLevel: CEFRLevel = 'C1',
  sounds?: readonly Sound[],
): Promise<DailyStep | null> {
  const signals = await db.essentialWordLearnerSignals.where('userId').equals(userId).toArray()
  const signal = signals
    .filter((entry) => entry.pronunciationDifficulty === 'self-reported')
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]
  if (!signal) return null
  const now = new Date()
  const lastRoutedAt = signal.pronunciationLastRoutedAt
    ? new Date(signal.pronunciationLastRoutedAt).getTime()
    : 0
  if (lastRoutedAt > 0 && now.getTime() - lastRoutedAt < 7 * 86_400_000) return null
  const route = routePronunciationDifficulty(signal.wordId, LEARNING_CHUNKS)
  if (!route) return null
  const contrastDiscrimination = await loadContrastDiscriminationExercise(
    route.pronunciationTargetIds,
    sounds,
  ).catch(() => null)
  const pronunciationExercises = buildPronunciationRouteExercises(
    route.chunks.slice(0, 1),
    route.pronunciationTargetIds,
    learnerLevel,
  )
  return {
    kind: 'chunk_review',
    id: `pronunciation_chunks:${route.wordId}:${route.chunks.map((chunk) => chunk.id).join(',')}`,
    title: 'Escucha y vuelve a usar esta expresión',
    subtitle: 'Primero escucha el modelo; después recupéralo y repítelo. La comparación no afirma un score acústico.',
    icon: 'Ear',
    exercises: contrastDiscrimination ? [contrastDiscrimination, ...pronunciationExercises] : pronunciationExercises,
    estMinutes: 4,
    chunks: route.chunks.slice(0, 1),
    featuredWords: chunkFeaturedWords(route.chunks.slice(0, 1)),
    pronunciationDifficultyWordId: signal.wordId,
  }
}

/** Starts the proposal cooldown only after the learner can actually see it. */
export async function markPronunciationDifficultyRouted(
  userId: string,
  wordId: string,
  now = new Date().toISOString(),
): Promise<void> {
  const signal = await db.essentialWordLearnerSignals.get(`${userId}:${wordId}`)
  if (!signal || signal.pronunciationDifficulty !== 'self-reported') return
  await db.essentialWordLearnerSignals.update(signal.id, { pronunciationLastRoutedAt: now })
}

export async function loadChunkPracticeSession(userId: string, level: CEFRLevel, limit = 3): Promise<ChunkPracticeSession> {
  const eligible = filterChunksForLevel(LEARNING_CHUNKS, level)
  const [srsRows, trackedRows] = await Promise.all([
    db.srsData.where('userId').equals(userId).toArray(),
    db.trackedItems.where('userId').equals(userId).toArray(),
  ])
  const now = Date.now()
  const stateById = new Map(srsRows.filter((row) => row.wordId.startsWith('chunk:')).map((row) => [row.wordId, row]))
  const savedIds = new Set(trackedRows.flatMap((row) => typeof row.payload?.chunkId === 'string' ? [row.payload.chunkId] : []))
  const rank = (chunk: LearningChunk): [number, number, number] => {
    const state = stateById.get(chunkSrsId(chunk.id))
    if (state && new Date(state.nextReview).getTime() <= now) return [0, new Date(state.nextReview).getTime(), dailyRank(chunk.id)]
    if (!state && savedIds.has(chunk.id)) return [1, 0, dailyRank(chunk.id)]
    if (!state) return [2, 0, dailyRank(chunk.id)]
    return [3, new Date(state.nextReview).getTime(), dailyRank(chunk.id)]
  }
  const chunks = [...eligible].sort((a, b) => {
    const left = rank(a)
    const right = rank(b)
    return left[0] - right[0] || left[1] - right[1] || left[2] - right[2]
  }).slice(0, limit)
  return { chunks, exercises: buildChunkExercises(chunks, eligible, 'practice', level) }
}

export async function loadDueChunkReviewStep(
  userId: string,
  context: Extract<PracticeContext, 'daily' | 'review'>,
  learnerLevel: CEFRLevel = 'C1',
): Promise<DailyStep | null> {
  const now = new Date().toISOString()
  const rows = await db.srsData
    .where('userId').equals(userId)
    .filter((row) => row.wordId.startsWith('chunk:') && row.nextReview <= now)
    .sortBy('nextReview')
  const dueIds = rows.slice(0, 1).map((row) => row.wordId.slice('chunk:'.length))
  const chunks = dueIds.flatMap((id) => LEARNING_CHUNKS.find((chunk) => chunk.id === id) ?? [])
  if (chunks.length === 0) return null
  return {
    kind: 'chunk_review',
    id: `review_chunks:${chunks.map((chunk) => chunk.id).join(',')}`,
    title: 'Recupera un chunk',
    subtitle: 'Comprende, escucha y úsalo en contexto',
    icon: 'MessageCircle',
    exercises: buildChunkExercises(chunks, LEARNING_CHUNKS, context, learnerLevel),
    estMinutes: 4,
    chunks,
    featuredWords: chunkFeaturedWords(chunks),
  }
}

export async function countDueChunks(userId: string): Promise<number> {
  const now = new Date().toISOString()
  return db.srsData
    .where('userId')
    .equals(userId)
    .filter((row) => row.wordId.startsWith('chunk:') && row.nextReview <= now)
    .count()
}

export async function getDueChunks(userId: string, limit = 3): Promise<LearningChunk[]> {
  const now = new Date().toISOString()
  const rows = await db.srsData
    .where('userId')
    .equals(userId)
    .filter((row) => row.wordId.startsWith('chunk:') && row.nextReview <= now)
    .sortBy('nextReview')
  const dueIds = rows.slice(0, limit).map((row) => row.wordId.slice('chunk:'.length))
  return dueIds.flatMap((id) => LEARNING_CHUNKS.find((chunk) => chunk.id === id) ?? [])
}
