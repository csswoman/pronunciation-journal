import { fetchCatalogIndex, fetchChunks } from '@/lib/essential-words/client'
import type { CatalogIndexEntry } from '@/lib/essential-words/catalog-index'
import { essentialWordId, type CefrLevel } from '@/lib/essential-words/types'
import type {
  WordSearchDifficulty,
  WordSearchItem,
  WordSearchMode,
  WordSearchPuzzle,
} from './types'
import {
  createWordSearchPuzzle,
  MAX_WORD_SEARCH_LENGTH,
  MIN_WORD_SEARCH_ITEMS,
  sanitizeWord,
} from './grid-generator'
import { pickUnrepeatedWords } from './word-sampling'

/** Shorter words are mostly function words ("the", "and") — poor puzzle targets. */
const MIN_ESSENTIAL_WORD_LENGTH = 4
/** Chunks are ~0.5–1 MB each; cap how many one puzzle may download. */
const MAX_CHUNKS_PER_PUZZLE = 3

export const ESSENTIAL_LEVEL_LABELS: Record<CefrLevel, string> = {
  A1: 'A1 · Básico',
  A2: 'A2 · Elemental',
  B1: 'B1 · Intermedio',
  B2: 'B2 · Intermedio alto',
  C1: 'C1 · Avanzado',
}

export function isPuzzleFriendlyEssentialWord(entry: Pick<CatalogIndexEntry, 'word'>): boolean {
  return (
    /^[A-Za-z]+$/.test(entry.word) &&
    entry.word.length >= MIN_ESSENTIAL_WORD_LENGTH &&
    entry.word.length <= MAX_WORD_SEARCH_LENGTH
  )
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/**
 * Restricts candidates to a few random chunks so a puzzle downloads at most
 * MAX_CHUNKS_PER_PUZZLE files, preferring words the learner has not seen.
 */
export function selectCandidateChunks(
  candidates: CatalogIndexEntry[],
  count: number,
  recentWords: Set<string>,
): CatalogIndexEntry[] {
  const freshByChunk = new Map<number, CatalogIndexEntry[]>()
  for (const entry of candidates) {
    if (recentWords.has(sanitizeWord(entry.word))) continue
    const bucket = freshByChunk.get(entry.chunk) ?? []
    bucket.push(entry)
    freshByChunk.set(entry.chunk, bucket)
  }

  const chosen = new Set<number>()
  let freshTotal = 0
  for (const chunk of shuffle([...freshByChunk.keys()])) {
    if (chosen.size >= MAX_CHUNKS_PER_PUZZLE || freshTotal >= count * 2) break
    chosen.add(chunk)
    freshTotal += freshByChunk.get(chunk)?.length ?? 0
  }

  // Everything seen already: fall back to random chunks from the full level.
  if (chosen.size === 0) {
    for (const chunk of shuffle([...new Set(candidates.map((entry) => entry.chunk))])) {
      if (chosen.size >= MAX_CHUNKS_PER_PUZZLE) break
      chosen.add(chunk)
    }
  }

  return candidates.filter((entry) => chosen.has(entry.chunk))
}

/** Builds a puzzle from the Core Essential Words at one CEFR level. */
export async function loadEssentialPuzzle(
  level: CefrLevel,
  mode: WordSearchMode,
  count: number,
  recentWords: Set<string>,
  difficulty: WordSearchDifficulty = 'normal',
): Promise<WordSearchPuzzle> {
  const catalog = await fetchCatalogIndex()
  const candidates = catalog.filter(
    (entry) => entry.cefr_level === level && isPuzzleFriendlyEssentialWord(entry),
  )
  if (candidates.length < MIN_WORD_SEARCH_ITEMS) {
    throw new Error(`El nivel ${level} no tiene suficientes palabras para jugar.`)
  }

  const pool = selectCandidateChunks(candidates, count, recentWords)
  const sampled = pickUnrepeatedWords(pool, count, recentWords)
  const details = await fetchChunks(sampled.map((entry) => entry.chunk))

  const items: Array<Omit<WordSearchItem, 'found' | 'foundAt'>> = sampled.map((entry) => {
    const word = details.get(essentialWordId(entry.word))
    return {
      id: `core1k-${entry.word.toLowerCase()}`,
      word: entry.word,
      displayWord: entry.word.toLowerCase(),
      ipa: entry.ipa_strong || null,
      clue: word?.meaning || word?.translation || `Palabra esencial (${level})`,
      meaningEs: word?.translation || null,
      exampleSentence: word?.example_sentence || null,
    }
  })

  return createWordSearchPuzzle(items, {
    title: `Palabras esenciales ${level}`,
    topic: 'Las palabras más frecuentes del inglés',
    source: 'essential',
    mode,
    difficulty,
  })
}
