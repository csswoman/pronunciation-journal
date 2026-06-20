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

export { hasEnoughContext } from '@/lib/exercises/eligibility'
