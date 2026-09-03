import { WEAK_FORM_WHITELIST } from '@/lib/essential-words/weak-forms'

export type StressTier = 'primary-beat' | 'weak-glide'

export interface RhythmicToken {
  /** The clean word without surrounding punctuation. */
  word: string
  /** The raw token preserving leading/trailing punctuation for display. */
  raw: string
  /** Whether this word carries sentence stress (content word). */
  isContent: boolean
  /** Whether this word has a weak/reduced phonetic form. */
  isWeak: boolean
  /** Pedagogical stress tier. */
  stressTier: StressTier
  /** Standard weak form IPA if applicable. */
  weakIpa?: string
}

export interface RhythmicSentenceAnalysis {
  sentence: string
  tokens: RhythmicToken[]
  contentWordCount: number
  functionWordCount: number
  /** Ratio of content words to total words (0 to 1). */
  contentRatio: number
}

/**
 * Common standard weak forms in General American English.
 */
const COMMON_WEAK_IPAS: Readonly<Record<string, string>> = {
  a: 'ə',
  an: 'ən',
  the: 'ðə',
  to: 'tə',
  and: 'ənd',
  of: 'əv',
  for: 'fɚ',
  at: 'ət',
  from: 'frəm',
  as: 'əz',
  that: 'ðət',
  than: 'ðən',
  but: 'bət',
  can: 'kən',
  could: 'kəd',
  should: 'ʃəd',
  would: 'wəd',
  must: 'məs',
  have: 'həv',
  has: 'həz',
  had: 'həd',
  do: 'də',
  does: 'dəz',
  am: 'əm',
  are: 'ɚ',
  was: 'wəz',
  were: 'wɚ',
  been: 'bɪn',
  you: 'jə',
  your: 'jɚ',
  he: 'hi',
  him: 'ɪm',
  his: 'ɪz',
  her: 'ɚ',
  us: 'əs',
  them: 'ðəm',
  some: 'səm',
}

/**
 * Closed-class grammatical function words in English that do not carry
 * primary sentence stress unless contrastively emphasized.
 */
const FUNCTION_WORDS: ReadonlySet<string> = new Set([
  ...WEAK_FORM_WHITELIST,
  'in',
  'on',
  'with',
  'by',
  'about',
  'into',
  'through',
  'after',
  'over',
  'between',
  'out',
  'against',
  'during',
  'without',
  'before',
  'under',
  'around',
  'among',
  'so',
  'if',
  'since',
  'while',
  'although',
  'because',
  'i',
  'me',
  'my',
  'it',
  'its',
  'they',
  'their',
  'our',
  'this',
  'these',
  'those',
])

/**
 * Words that are negative markers carry sentence stress because negation
 * changes semantic truth value and is phonetically accented in English.
 */
function isNegativeStressedWord(cleanWord: string): boolean {
  if (cleanWord === 'not' || cleanWord === 'no' || cleanWord === 'never') return true
  if (cleanWord.endsWith("n't") || cleanWord.endsWith('nt')) return true
  return false
}

/**
 * Analyzes an English sentence to identify stress-timed rhythm:
 * - Content words (nouns, main verbs, adjectives, adverbs, negatives) receive primary beats.
 * - Function words (articles, prepositions, auxiliaries, pronouns) are reduced and glide between beats.
 */
export function analyzeSentenceRhythm(sentence: string): RhythmicSentenceAnalysis {
  if (!sentence.trim()) {
    return {
      sentence,
      tokens: [],
      contentWordCount: 0,
      functionWordCount: 0,
      contentRatio: 0,
    }
  }

  // Tokenize preserving whitespaces and words
  const rawTokens = sentence.trim().split(/\s+/)
  const tokens: RhythmicToken[] = []
  let contentWordCount = 0
  let functionWordCount = 0

  for (const raw of rawTokens) {
    // Strip leading and trailing punctuation for classification
    const cleanWord = raw
      .toLowerCase()
      .replace(/^[^a-z0-9']+|[^a-z0-9']+$/gi, '')

    if (!cleanWord) {
      tokens.push({
        word: raw,
        raw,
        isContent: false,
        isWeak: false,
        stressTier: 'weak-glide',
      })
      continue
    }

    const isNegative = isNegativeStressedWord(cleanWord)
    const isFunction = !isNegative && FUNCTION_WORDS.has(cleanWord)
    const isContent = !isFunction
    const isWeak = isFunction && (WEAK_FORM_WHITELIST.has(cleanWord) || Boolean(COMMON_WEAK_IPAS[cleanWord]))
    const weakIpa = COMMON_WEAK_IPAS[cleanWord]

    if (isContent) {
      contentWordCount++
    } else {
      functionWordCount++
    }

    tokens.push({
      word: cleanWord,
      raw,
      isContent,
      isWeak,
      stressTier: isContent ? 'primary-beat' : 'weak-glide',
      weakIpa,
    })
  }

  const totalWords = contentWordCount + functionWordCount
  const contentRatio = totalWords > 0 ? contentWordCount / totalWords : 0

  return {
    sentence,
    tokens,
    contentWordCount,
    functionWordCount,
    contentRatio,
  }
}
