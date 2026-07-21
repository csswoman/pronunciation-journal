import { isSavedOrFamiliar } from '@/lib/word-bank/progress-state'
import type { WordBankEntry } from '@/lib/word-bank/types'

export const SAVED_REVIEW_QUOTA = 2

export interface DailyWordCandidates {
  newWords: WordBankEntry[]
  dueWords: WordBankEntry[]
  savedOrFamiliarWords: WordBankEntry[]
  limit: number
  savedQuota?: number
}

export interface DailyWordSelection {
  words: WordBankEntry[]
  savedOrFamiliarIds: Set<string>
}

function uniqueById(words: WordBankEntry[]): WordBankEntry[] {
  const seen = new Set<string>()
  return words.filter((word) => {
    if (seen.has(word.id)) return false
    seen.add(word.id)
    return true
  })
}

/**
 * Select the daily vocabulary slice without allowing saved intent to outrank
 * an actually due SRS item. Saved/familiar content is a small tiebreak quota,
 * and its inclusion never mutates an SRS date.
 */
export function selectDailyReviewWords({
  newWords,
  dueWords,
  savedOrFamiliarWords,
  limit,
  savedQuota = SAVED_REVIEW_QUOTA,
}: DailyWordCandidates): DailyWordSelection {
  if (limit <= 0) return { words: [], savedOrFamiliarIds: new Set() }

  const due = uniqueById(dueWords)
  const dueIds = new Set(due.map((word) => word.id))
  const boosted = uniqueById(savedOrFamiliarWords)
    .filter((word) => !dueIds.has(word.id) && isSavedOrFamiliar(word))
    .slice(0, Math.max(0, savedQuota))
  const selectedIds = new Set(due.map((word) => word.id))
  const selectedBoostedIds = new Set<string>()
  const words = [...due]

  for (const word of boosted) {
    if (words.length >= limit) break
    if (selectedIds.has(word.id)) continue
    words.push(word)
    selectedIds.add(word.id)
    selectedBoostedIds.add(word.id)
  }

  for (const word of uniqueById(newWords)) {
    if (words.length >= limit) break
    if (selectedIds.has(word.id)) continue
    words.push(word)
    selectedIds.add(word.id)
  }

  return {
    words: words.slice(0, limit),
    savedOrFamiliarIds: selectedBoostedIds,
  }
}
