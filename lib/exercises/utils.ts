import type { CEFRLevel } from '@/lib/exercises/cefr'

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

interface SrsSignals {
  ease_factor?: number | null
  interval_days?: number | null
  next_review_at?: string | null
}

/**
 * Higher = needs more practice: overdue for review, low SM-2 ease, short
 * interval. Entries with no SRS signal score 0 and fall back to jitter.
 */
export function weaknessScore(entry: SrsSignals, now = Date.now()): number {
  const due = entry.next_review_at ? Date.parse(entry.next_review_at) : NaN
  const overdue = Number.isFinite(due) && due <= now ? 2 : 0
  const ease = typeof entry.ease_factor === 'number' ? Math.max(0, 2.5 - entry.ease_factor) : 0
  const interval = typeof entry.interval_days === 'number' ? 1 / (1 + entry.interval_days) : 0
  return overdue + ease + interval
}

/**
 * Picks `n` entries prioritising the weakest words. A small random jitter
 * keeps sessions from repeating the exact same word every time.
 */
export function pickWeakest<T extends SrsSignals>(arr: T[], n: number): T[] {
  const now = Date.now()
  return arr
    .map((entry) => ({ entry, score: weaknessScore(entry, now) + Math.random() * 0.75 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map(({ entry }) => entry)
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

/**
 * True when `text` reads as a real example sentence, not lesson notation.
 *
 * Reorder/dictation exercises ("type the sentence", "put the words in order")
 * assume the target is a sentence. Some content sources — connected-speech
 * decks, seeded `text_fragments` — also carry transformation/alternation rows
 * (e.g. "going to → gonna", "turn off / turn it off", "PREsent (n.) / preSENT
 * (v.)"). Those are study notes, not sentences, and make nonsensical exercises.
 * This predicate rejects them so a single guard can gate every generator.
 *
 * It is intentionally conservative: it only rejects clear notation markers, so
 * ordinary sentences (including ones with hyphens or apostrophes) pass.
 */
export function isLikelySentence(text: string): boolean {
  const trimmed = text.trim()
  if (trimmed === '') return false

  // Transformation / mapping notation: "a → b", "x = y".
  if (/[→=]/.test(trimmed)) return false
  // Slash alternation between alternatives: "turn off / turn it off".
  if (/\s\/\s/.test(trimmed)) return false
  // Part-of-speech / stress-shift notation: "(n.)", "(v.)", "(adj.)".
  if (/\((?:n|v|adj|adv|prep)\.\)/i.test(trimmed)) return false

  // A real sentence has at least two words.
  return tokenize(trimmed).length >= 2
}

/**
 * Longest sentence a learner at `level` should be asked to reorder.
 *
 * Reordering a long sentence tests working memory, not grammar — at A1/A2 that
 * makes it frustrating rather than instructive. The item's own difficulty
 * rating doesn't catch this: an easy word or chunk can still sit in a long
 * example sentence, so this caps the SENTENCE, independent of its rated level.
 *
 * `undefined` (learner level unknown) applies no cap, preserving the behaviour
 * of callers that never had a level to pass.
 */
export function maxReorderTokensForLevel(level?: CEFRLevel): number {
  if (level === 'A1') return 5
  if (level === 'A2') return 7
  return Number.POSITIVE_INFINITY
}

/** True when `sentence` is short enough to reorder at `level`. */
export function fitsReorderLength(sentence: string, level?: CEFRLevel): boolean {
  return tokenize(sentence).length <= maxReorderTokensForLevel(level)
}

export { hasEnoughContext } from '@/lib/exercises/eligibility'
