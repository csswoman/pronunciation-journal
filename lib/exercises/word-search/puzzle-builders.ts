import type { WordBankEntry } from '@/lib/word-bank/types'
import { fetchWithTimeout } from '@/lib/api/timeout'
import type {
  WordSearchDifficulty,
  WordSearchItem,
  WordSearchMode,
  WordSearchPuzzle,
} from './types'
import { CURATED_PUZZLE_ITEMS, WORD_SEARCH_PRESETS } from './presets'
import { createWordSearchPuzzle } from './grid-generator'
import { pickUnrepeatedWords } from './word-sampling'

/** Max recently played words sent to the AI route (its schema caps at 30). */
const MAX_AI_EXCLUDED_WORDS = 30

export interface PuzzleBuildOptions {
  mode: WordSearchMode
  difficulty: WordSearchDifficulty
  count: number
  recentWords: Set<string>
}

export function buildCuratedPuzzle(
  presetId: string,
  { mode, difficulty, count, recentWords }: PuzzleBuildOptions,
): WordSearchPuzzle {
  const preset = WORD_SEARCH_PRESETS.find((item) => item.id === presetId)
  const rawItems = preset ? CURATED_PUZZLE_ITEMS[preset.id] : undefined
  if (!preset || !rawItems?.length) {
    throw new Error('Este tema todavía no tiene contenido preparado.')
  }

  return createWordSearchPuzzle(pickUnrepeatedWords(rawItems, count, recentWords), {
    title: preset.title,
    topic: preset.description,
    source: 'curated',
    mode,
    difficulty,
  })
}

export function buildMyWordsPuzzle(
  myWords: WordBankEntry[],
  { mode, difficulty, count, recentWords }: PuzzleBuildOptions,
): WordSearchPuzzle {
  const pool = myWords.map((entry) => ({ ...entry, word: entry.text }))
  const items = pickUnrepeatedWords(pool, count, recentWords).map((entry, index) => ({
    id: `my-${entry.id || index}`,
    word: entry.text,
    displayWord: entry.text,
    ipa: entry.ipa,
    clue: entry.meaning || entry.translation || `Palabra de tu cuaderno: ${entry.text}`,
    meaningEs: entry.translation || entry.meaning,
    exampleSentence: entry.example,
  }))

  return createWordSearchPuzzle(items, {
    title: 'Mis palabras',
    topic: 'Vocabulario de tu cuaderno personal',
    source: 'word_bank',
    mode,
    difficulty,
  })
}

interface GeminiWord {
  word: string
  ipa?: string
  clue: string
  meaningEs: string
  exampleSentence: string
}

export async function requestGeminiPuzzle(
  input: {
    topic: string
    level: 'beginner' | 'intermediate' | 'advanced'
    knownWords: string[]
  },
  { mode, difficulty, count, recentWords }: PuzzleBuildOptions,
): Promise<WordSearchPuzzle> {
  const response = await fetchWithTimeout('/api/gemini/word-search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      topic: input.topic,
      level: input.level,
      count,
      knownWords: input.knownWords.slice(0, 10),
      excludeWords: Array.from(recentWords).slice(0, MAX_AI_EXCLUDED_WORDS),
    }),
  }, 30_000)

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.error || `Error ${response.status}`)
  }

  const data = (await response.json()) as { topicTitle?: string; words: GeminiWord[] }
  const items: Array<Omit<WordSearchItem, 'found' | 'foundAt'>> = data.words.map(
    (word, index) => ({
      id: `ai-${index}`,
      word: word.word,
      displayWord: word.word.toLowerCase(),
      ipa: word.ipa,
      clue: word.clue,
      meaningEs: word.meaningEs,
      exampleSentence: word.exampleSentence,
    }),
  )

  return createWordSearchPuzzle(items, {
    title: data.topicTitle || input.topic,
    topic: input.topic,
    source: 'gemini',
    mode,
    difficulty,
  })
}
