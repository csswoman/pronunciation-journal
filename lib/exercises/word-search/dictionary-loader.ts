import lexiconIndex from '../../../public/lexicon/index.json'
import type { WordSearchItem, WordSearchMode, WordSearchPuzzle } from './types'
import { createWordSearchPuzzle } from './grid-generator'

export interface DictionaryCategorySummary {
  id: string
  name: string
  domain: string
  color: string
  icon: string
  total: number
}

export const DICTIONARY_CATEGORIES: DictionaryCategorySummary[] =
  lexiconIndex as DictionaryCategorySummary[]

interface RawLexiconWord {
  id: string
  word: string
  pos?: string
  definition: string
  difficulty?: number
  ipa?: string
  exampleSentence?: string
}

/**
 * Loads a word search puzzle directly from a dictionary category.
 */
export async function loadDictionaryPuzzle(
  categoryId: string,
  mode: WordSearchMode,
  count = 6
): Promise<WordSearchPuzzle> {
  const category =
    DICTIONARY_CATEGORIES.find((c) => c.id === categoryId) ||
    DICTIONARY_CATEGORIES[0]

  const response = await fetch(`/api/dictionary/${category.id}`)
  if (!response.ok) {
    throw new Error(`No se pudo cargar el diccionario de ${category.name}`)
  }

  const data = await response.json()
  const rawWords = (data.words ?? []) as RawLexiconWord[]

  // Filter single words suitable for a word search grid (3 to 10 chars, no spaces/hyphens)
  const validWords = rawWords.filter(
    (w) =>
      w.word &&
      w.word.trim().length >= 3 &&
      w.word.trim().length <= 10 &&
      !w.word.includes(' ') &&
      !w.word.includes('-')
  )

  // Shuffle and pick `count` words
  const shuffled = [...validWords].sort(() => Math.random() - 0.5).slice(0, count)

  const items: Array<Omit<WordSearchItem, 'found' | 'foundAt'>> = shuffled.map(
    (w, idx) => ({
      id: `dict-${category.id}-${w.id || idx}`,
      word: w.word,
      displayWord: w.word,
      ipa: w.ipa || null,
      clue: w.definition,
      meaningEs: null,
      exampleSentence: w.exampleSentence || null,
    })
  )

  return createWordSearchPuzzle(items, {
    title: category.name,
    topic: `Diccionario: Área de ${category.name}`,
    source: 'dictionary',
    mode,
  })
}
