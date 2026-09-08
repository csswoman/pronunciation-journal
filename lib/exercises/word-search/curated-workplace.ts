import type { WordSearchItem } from './types'
import professionalJson from '../../../public/lexicon/professional.json'
import backendJson from '../../../public/lexicon/backend-infra.json'
import { MAX_WORD_SEARCH_LENGTH, sanitizeWord } from './grid-generator'

interface RawLexiconEntry {
  id: string
  word: string
  pos?: string
  definition: string
  difficulty?: number
  ipa?: string
  exampleSentence?: string
  translation?: string
}

function processLexiconEntries(
  entries: RawLexiconEntry[],
  prefix: string,
): Array<Omit<WordSearchItem, 'found' | 'foundAt'>> {
  const result: Array<Omit<WordSearchItem, 'found' | 'foundAt'>> = []

  for (const entry of entries) {
    if (!entry.word || entry.word.includes(' ') || entry.word.includes('-')) {
      continue
    }

    const clean = sanitizeWord(entry.word)
    if (clean.length < 3 || clean.length > MAX_WORD_SEARCH_LENGTH) {
      continue
    }

    result.push({
      id: `${prefix}-${entry.id}`,
      word: clean,
      displayWord: entry.word.toLowerCase(),
      ipa: entry.ipa || null,
      clue: entry.definition,
      meaningEs: entry.translation || null,
      exampleSentence: entry.exampleSentence || null,
    })
  }

  return result
}

const professionalWords = processLexiconEntries(
  professionalJson as RawLexiconEntry[],
  'prof',
)
const backendWords = processLexiconEntries(
  backendJson as RawLexiconEntry[],
  'back',
)

// Deduplicate across both files
const combined = [...professionalWords, ...backendWords]
const seen = new Set<string>()

export const WORKPLACE_TECH_WORDS: Array<Omit<WordSearchItem, 'found' | 'foundAt'>> =
  combined.filter((item) => {
    if (seen.has(item.word)) return false
    seen.add(item.word)
    return true
  })

