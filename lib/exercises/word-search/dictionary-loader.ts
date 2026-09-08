import lexiconIndex from '../../../public/lexicon/index.json'
import type { WordSearchItem, WordSearchMode, WordSearchPuzzle } from './types'
import {
  createWordSearchPuzzle,
  MAX_WORD_SEARCH_LENGTH,
  MIN_WORD_SEARCH_ITEMS,
  sanitizeWord,
} from './grid-generator'
import { pickUnrepeatedWords } from './word-sampling'

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

function shuffledCopy<T>(items: T[]): T[] {
  const shuffled = [...items]
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    const current = shuffled[index]
    shuffled[index] = shuffled[swapIndex]
    shuffled[swapIndex] = current
  }
  return shuffled
}

interface RawLexiconWord {
  id: string
  word: string
  pos?: string
  definition: string
  difficulty?: number
  ipa?: string
  exampleSentence?: string
  translation?: string
}

/**
 * Loads a word search puzzle directly from a dictionary category.
 */
export async function loadDictionaryPuzzle(
  categoryId: string,
  mode: WordSearchMode,
  count = 8,
  recentWords?: Set<string>
): Promise<WordSearchPuzzle> {
  const category = DICTIONARY_CATEGORIES.find((c) => c.id === categoryId)
  if (!category) {
    throw new Error('El área del diccionario seleccionada no existe.')
  }

  const response = await fetch(`/api/lexicon/${category.id}`)
  if (!response.ok) {
    throw new Error(`No se pudo cargar el diccionario de ${category.name}`)
  }

  const data = await response.json()
  const rawWords = (data.words ?? []) as RawLexiconWord[]

  // Keep only single answers that can fit the supported grid.
  const validWords = rawWords.filter(
    (entry) => {
      const clean = sanitizeWord(entry.word ?? '')
      return (
        clean.length >= 3 &&
        clean.length <= MAX_WORD_SEARCH_LENGTH &&
        !entry.word.includes(' ') &&
        !entry.word.includes('-')
      )
    },
  )

  if (validWords.length < MIN_WORD_SEARCH_ITEMS) {
    throw new Error(`El área ${category.name} no tiene suficientes palabras para jugar.`)
  }

  const sampled = recentWords
    ? pickUnrepeatedWords(validWords, count, recentWords)
    : shuffledCopy(validWords).slice(0, count)

  const items: Array<Omit<WordSearchItem, 'found' | 'foundAt'>> = sampled.map(
    (w, idx) => ({
      id: `dict-${category.id}-${w.id || idx}`,
      word: w.word,
      displayWord: w.word,
      ipa: w.ipa || null,
      clue: w.definition,
      meaningEs: w.translation || null,
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
