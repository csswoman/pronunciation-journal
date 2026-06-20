import type { WordBankEntry } from '@/lib/word-bank/types'

/** Minimum content words that must remain visible after blanking a target word. */
export const MIN_CONTENT_WORDS_AFTER_BLANK = 2

/** Minimum whitespace-separated tokens for reorder exercises. */
export const MIN_REORDER_TOKENS = 4

/** Distractor options required beside the correct answer (fill-blank, sentence_context). */
export const DISTRACTOR_COUNT = 3

/** Usable pool size needed so one entry can get DISTRACTOR_COUNT unique distractors. */
export const MIN_POOL_FOR_FILL_BLANK = DISTRACTOR_COUNT + 1

export type ExerciseMode =
  | 'fill_blank'
  | 'reorder_words'
  | 'sentence_dictation'
  | 'match_pairs'
  | 'sentence_context'
  | 'written_production'
  | 'spoken_production'

export type EligibilityReason =
  | 'missing_example'
  | 'missing_text'
  | 'missing_meaning'
  | 'word_not_in_sentence'
  | 'insufficient_context'
  | 'sentence_too_short'
  | 'insufficient_distractor_pool'

export interface EligibilityResult {
  eligible: boolean
  reasons: EligibilityReason[]
}

export interface AssessWordBankEntryOptions {
  /** When set, fill_blank also checks whether the pool can supply distractors. */
  pool?: WordBankEntry[]
}

const IRREGULAR_FORMS: Readonly<Record<string, readonly string[]>> = {
  be: ['am', 'is', 'are', 'was', 'were', 'been', 'being'],
}

const INFLECTION_SUFFIXES =
  /^(?:s|es|ed|d|ing|er|est|ies|ied|ying|ier|iest|ers|ors|ists|ments|ness|tion|sions?|able|ible|ful|less|ous|ive|al|ity|ance|ence|ship|dom|ward|wards|ly)$/

const FUNCTION_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'so', 'yet', 'nor',
  'in', 'on', 'at', 'to', 'for', 'of', 'by', 'as', 'up',
  'it', 'its', 'this', 'that', 'these', 'those',
  'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'can', 'could', 'may', 'might', 'shall', 'should', 'must',
  'not', 'no', 'nor', 'very', 'just', 'also', 'too',
  'i', 'you', 'he', 'she', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
  'my', 'your', 'his', 'our', 'their',
])

function escapeWordRegex(word: string): string {
  return word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function matchesInflection(token: string, lemma: string): boolean {
  if (token.startsWith(lemma) && token.length > lemma.length) {
    if (INFLECTION_SUFFIXES.test(token.slice(lemma.length))) return true
  }

  if (lemma.endsWith('e') && token.startsWith(lemma.slice(0, -1))) {
    const rest = token.slice(lemma.length - 1)
    if (/^(?:d|ds|ing|ed|er|est|s|rs?)$/.test(rest)) return true
  }

  if (lemma.length >= 3 && token.startsWith(lemma.slice(0, -1))) {
    const doubled = lemma.slice(-1)
    if (token.startsWith(lemma.slice(0, -1) + doubled)) {
      return INFLECTION_SUFFIXES.test(token.slice(lemma.length))
    }
  }

  if (lemma.endsWith('y') && token.startsWith(lemma.slice(0, -1))) {
    return /^(?:ies|ied|ying|ier|iest|y)$/.test(token.slice(lemma.length - 1))
  }

  return false
}

function tokenMatchesLemma(token: string, lemma: string): boolean {
  if (token === lemma) return true
  if (matchesInflection(token, lemma)) return true

  const irregulars = IRREGULAR_FORMS[lemma]
  if (irregulars?.includes(token)) return true

  if (lemma.length >= 4 && token !== lemma && (token.startsWith(lemma) || token.endsWith(lemma))) {
    return true
  }

  return false
}

/** True when the sentence uses the lemma or a common inflected/compound surface form. */
export function sentenceContainsLemma(sentence: string, word: string): boolean {
  const lemma = word.toLowerCase()
  const escaped = escapeWordRegex(word)

  if (new RegExp(`\\b${escaped}\\b`, 'i').test(sentence)) return true

  const irregulars = IRREGULAR_FORMS[lemma]
  if (irregulars?.some((form) => new RegExp(`\\b${escapeWordRegex(form)}\\b`, 'i').test(sentence))) {
    return true
  }

  const tokens = sentence.match(/\b[\w'-]+\b/g) ?? []
  for (const raw of tokens) {
    const token = raw.toLowerCase().replace(/'/g, '')
    if (tokenMatchesLemma(token, lemma)) return true
  }

  return false
}

/** @deprecated Prefer `sentenceContainsLemma` — kept for validate-core importers. */
export const sentenceContainsWord = sentenceContainsLemma

/**
 * Replace the first lemma surface form in `sentence` with "___".
 * Tries an exact `\bword\b` match first, then inflected/compound tokens.
 */
export function blankLemma(sentence: string, word: string): string | null {
  const escaped = escapeWordRegex(word)
  const exact = new RegExp(`\\b${escaped}\\b`, 'i')
  if (exact.test(sentence)) {
    return sentence.replace(exact, '___')
  }

  if (!sentenceContainsLemma(sentence, word)) return null

  const lemma = word.toLowerCase()
  const tokens = sentence.match(/\b[\w'-]+\b/g) ?? []
  for (const raw of tokens) {
    const token = raw.toLowerCase().replace(/'/g, '')
    if (tokenMatchesLemma(token, lemma)) {
      return sentence.replace(new RegExp(`\\b${escapeWordRegex(raw)}\\b`), '___')
    }
  }

  return null
}

function countTokens(sentence: string): number {
  return sentence.trim().split(/\s+/).filter(Boolean).length
}

/**
 * Returns true if a blanked sentence has enough context to guess the missing
 * word. Heuristic: at least MIN_CONTENT_WORDS_AFTER_BLANK non-function words remain.
 */
export function hasEnoughContext(blanked: string): boolean {
  const tokens = blanked
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .split(/\s+/)
    .filter((t) => t && t !== '___')
  const contentWords = tokens.filter((t) => !FUNCTION_WORDS.has(t))
  return contentWords.length >= MIN_CONTENT_WORDS_AFTER_BLANK
}

function assessBlankModes(entry: WordBankEntry, reasons: EligibilityReason[]): void {
  if (!entry.example) {
    reasons.push('missing_example')
    return
  }
  if (!entry.text) {
    reasons.push('missing_text')
    return
  }
  if (!sentenceContainsLemma(entry.example, entry.text)) {
    reasons.push('word_not_in_sentence')
    return
  }
  const blanked = blankLemma(entry.example, entry.text)
  if (!blanked || !hasEnoughContext(blanked)) {
    reasons.push('insufficient_context')
  }
}

function countFillBlankDistractors(entry: WordBankEntry, pool: WordBankEntry[]): number {
  const answer = entry.text
  return pool.filter((candidate) => {
    if (candidate.id === entry.id || candidate.text === answer) return false
    return assessWordBankEntry(candidate, 'fill_blank').eligible
  }).length
}

/**
 * Single source of truth for whether a word-bank row can feed a generator mode.
 */
export function assessWordBankEntry(
  entry: WordBankEntry,
  mode: ExerciseMode,
  options: AssessWordBankEntryOptions = {},
): EligibilityResult {
  const reasons: EligibilityReason[] = []

  switch (mode) {
    case 'fill_blank':
    case 'sentence_context':
      assessBlankModes(entry, reasons)
      if (
        reasons.length === 0 &&
        options.pool &&
        countFillBlankDistractors(entry, options.pool) < DISTRACTOR_COUNT
      ) {
        reasons.push('insufficient_distractor_pool')
      }
      break

    case 'reorder_words':
      if (!entry.example) {
        reasons.push('missing_example')
      } else if (countTokens(entry.example) < MIN_REORDER_TOKENS) {
        reasons.push('sentence_too_short')
      }
      break

    case 'sentence_dictation':
      if (!entry.example) reasons.push('missing_example')
      break

    case 'match_pairs':
      if (!entry.text) reasons.push('missing_text')
      if (!entry.meaning) reasons.push('missing_meaning')
      break

    case 'written_production':
    case 'spoken_production':
      if (!entry.text) reasons.push('missing_text')
      break
  }

  return { eligible: reasons.length === 0, reasons }
}
