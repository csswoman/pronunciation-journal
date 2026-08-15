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

export const DICTIONARY_CATEGORIES: DictionaryCategorySummary[] = [
  {
    id: 'frontend-dev',
    name: 'Frontend Dev',
    domain: 'engineering',
    color: '#65A87A',
    icon: '⌥',
    total: 81,
  },
  {
    id: 'backend-infra',
    name: 'Backend & Infra',
    domain: 'engineering',
    color: '#D97706',
    icon: '⬡',
    total: 72,
  },
  {
    id: 'artificial-intelligence',
    name: 'Artificial Intelligence',
    domain: 'engineering',
    color: '#A855F7',
    icon: '◎',
    total: 82,
  },
  {
    id: 'data-science',
    name: 'Data Science',
    domain: 'engineering',
    color: '#EAB308',
    icon: '◉',
    total: 82,
  },
  {
    id: 'ux-design',
    name: 'UX / UI Design',
    domain: 'design',
    color: '#6B9FC4',
    icon: '✦',
    total: 81,
  },
  {
    id: 'design-systems',
    name: 'Design Systems',
    domain: 'design',
    color: '#9B8EC4',
    icon: '◻',
    total: 72,
  },
  {
    id: 'personal-interview',
    name: 'Personal Interview',
    domain: 'professional',
    color: '#EC4899',
    icon: '🎤',
    total: 79,
  },
  {
    id: 'professional',
    name: 'Professional English',
    domain: 'professional',
    color: '#C4846B',
    icon: '◈',
    total: 83,
  },
  {
    id: 'technical-writing',
    name: 'Technical Writing',
    domain: 'professional',
    color: '#5BA8A0',
    icon: '∂',
    total: 63,
  },
]

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
