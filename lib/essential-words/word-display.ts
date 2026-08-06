import type { EssentialWordPos } from './types'

/** English lemmas that are always uppercase regardless of dataset casing. */
const ALWAYS_UPPERCASE = new Set(['i'])

/**
 * Lemmas stored lowercase that should render title-cased (proper nouns, etc.).
 * Extend as the dataset grows.
 */
const TITLE_CASE_LEMMAS = new Set<string>([
  'english',
  'january',
  'monday',
])

function titleCaseLemma(word: string): string {
  if (word.length === 0) return word
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
}

export interface DisplayEnglishWordOptions {
  pos?: EssentialWordPos
}

/**
 * Surface form for English lemmas in UI. Grading stays case-insensitive; this
 * only affects what the learner sees.
 */
export function displayEnglishWord(
  word: string,
  options: DisplayEnglishWordOptions = {},
): string {
  const trimmed = word.trim()
  if (!trimmed) return trimmed

  const lower = trimmed.toLowerCase()
  if (ALWAYS_UPPERCASE.has(lower)) return 'I'
  if (TITLE_CASE_LEMMAS.has(lower)) return titleCaseLemma(trimmed)

  // Preserve multi-word lemmas as authored when not in the title-case list.
  if (options.pos === 'pronoun' && lower === 'i') return 'I'

  return trimmed
}

/** Display normalization for example sentences and definitions shown in UI. */
export function displayEnglishText(text: string): string {
  return text
    .replace(/\bi\b/g, 'I')
    .replace(/(^|[.!?]\s+)([a-z])/g, (_, prefix: string, letter: string) => `${prefix}${letter.toUpperCase()}`)
}

/** Normalize learner input for case-insensitive lemma comparison. */
export function normalizeEnglishAnswer(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9']/g, '')
    .trim()
}
