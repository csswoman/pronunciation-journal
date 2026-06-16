/** Shuffle an array in-place (Fisher-Yates) and return it. */
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Pick n random items from an array. */
export function pick<T>(arr: T[], n: number): T[] {
  return shuffle(arr).slice(0, n)
}

/**
 * Deterministic id for an exercise. Combines type + source + stable fields
 * so the same content always produces the same id (dedup in Dexie / answer_history).
 */
export function exerciseId(type: string, sourceId: string, discriminator?: string): string {
  const raw = `${type}:${sourceId}:${discriminator ?? ''}`
  // djb2 hash — fast, collision-free for our scale
  let hash = 5381
  for (let i = 0; i < raw.length; i++) {
    hash = (hash * 33) ^ raw.charCodeAt(i)
  }
  return (hash >>> 0).toString(36)
}

/**
 * Replace the first occurrence of `word` in `sentence` with "___",
 * case-insensitive. Returns null if word doesn't appear.
 */
export function blankWord(sentence: string, word: string): string | null {
  const re = new RegExp(`\\b${escapeRegex(word)}\\b`, 'i')
  if (!re.test(sentence)) return null
  return sentence.replace(re, '___')
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Tokenize a sentence into word tokens (punctuation attached to words). */
export function tokenize(sentence: string): string[] {
  return sentence.trim().split(/\s+/).filter(Boolean)
}

// Common English function words that rarely provide enough context as a blank.
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

/**
 * Returns true if a blanked sentence has enough context to guess the missing
 * word. Heuristic: at least 2 non-function content words must remain visible.
 * Rejects patterns like "The ___ is very good" where almost no content remains.
 */
export function hasEnoughContext(blanked: string): boolean {
  const tokens = blanked
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .split(/\s+/)
    .filter(t => t && t !== '___')
  const contentWords = tokens.filter(t => !FUNCTION_WORDS.has(t))
  return contentWords.length >= 2
}
