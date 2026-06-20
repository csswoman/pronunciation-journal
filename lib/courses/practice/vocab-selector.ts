import type { CoreWord, CefrLevel } from '@/lib/core-1000/types'
import { core1000WordId } from '@/lib/core-1000/types'

/**
 * Returns up to `limit` Core 1000 words for the given CEFR level that have
 * no existing SRS entry. Only introduces new vocabulary — never due/review words.
 */
export function selectNewWordsForLevel(
  words: CoreWord[],
  level: CefrLevel,
  seenWordIds: Set<string>,
  limit: number,
): CoreWord[] {
  return words
    .filter((w) => w.cefr_level === level && !seenWordIds.has(core1000WordId(w.word)))
    .sort((a, b) => a.rank - b.rank)
    .slice(0, limit)
}
