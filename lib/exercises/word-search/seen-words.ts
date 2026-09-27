import { db, type WordSearchSeenWordRecord } from '@/lib/db'
import { sanitizeWord } from './grid-generator'

/** How many recently played words stay excluded from new puzzles. */
export const MAX_RECENT_WORD_SEARCH_WORDS = 120
const GUEST_KEY = 'guest'

function ownerKey(userId: string | null | undefined): string {
  return userId || GUEST_KEY
}

/**
 * Persists the words of a started puzzle so later sessions (even after a
 * reload) avoid repeating them. Best-effort: IndexedDB failures never block play.
 */
export async function saveWordSearchSeenWords(
  userId: string | null | undefined,
  words: Iterable<string>,
): Promise<void> {
  const owner = ownerKey(userId)
  const seenAt = new Date().toISOString()
  const rows: WordSearchSeenWordRecord[] = []
  for (const raw of words) {
    const word = sanitizeWord(raw)
    if (word) rows.push({ id: `${owner}:${word}`, userId: owner, word, seenAt })
  }
  if (rows.length === 0) return
  try {
    await db.wordSearchSeenWords.bulkPut(rows)
  } catch (error) {
    console.warn('[word-search] could not persist seen words', error)
  }
}

/** Returns the most recently played words, newest first. */
export async function getRecentWordSearchWords(
  userId: string | null | undefined,
  limit = MAX_RECENT_WORD_SEARCH_WORDS,
): Promise<string[]> {
  try {
    const rows = await db.wordSearchSeenWords
      .where('userId')
      .equals(ownerKey(userId))
      .reverse()
      .sortBy('seenAt')
    return rows.slice(0, limit).map((row) => row.word)
  } catch {
    return []
  }
}
