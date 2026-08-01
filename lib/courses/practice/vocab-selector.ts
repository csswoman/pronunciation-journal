import type { EssentialWord, CefrLevel } from '@/lib/essential-words/types'
import { essentialWordId } from '@/lib/essential-words/types'

/**
 * Returns up to `limit` Core 1000 words for the given CEFR level that have
 * no existing SRS entry. Only introduces new vocabulary — never due/review words.
 */
export function selectNewWordsForLevel(
  words: EssentialWord[],
  level: CefrLevel,
  seenWordIds: Set<string>,
  limit: number,
): EssentialWord[] {
  return words
    .filter((w) => w.cefr_level === level && !seenWordIds.has(essentialWordId(w.word)))
    .sort((a, b) => a.rank - b.rank)
    .slice(0, limit)
}
