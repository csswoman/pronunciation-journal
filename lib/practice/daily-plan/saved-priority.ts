import { isSavedOrFamiliar } from '@/lib/word-bank/progress-state'
import type { WordBankEntry } from '@/lib/word-bank/types'
import { isCefrAppropriate, normalizeCEFR, type CEFRLevel } from '@/lib/exercises/cefr'

export const SAVED_REVIEW_QUOTA = 2

export interface DailyWordCandidates {
  newWords: WordBankEntry[]
  dueWords: WordBankEntry[]
  savedOrFamiliarWords: WordBankEntry[]
  limit: number
  savedQuota?: number
  /**
   * Learner's CEFR level. When given, entries whose difficulty is more than
   * one level away are deprioritized — an A1 should not get a B2 example
   * sentence just because that word is due today. Entries without a
   * difficulty always pass through (never invent a bar that isn't there).
   */
  learnerLevel?: CEFRLevel
}

/**
 * True when `entry` is within one CEFR level of `learnerLevel`, or has no
 * difficulty rating at all (nothing to filter on, so it stays eligible).
 */
function isWithinLearnerLevel(entry: WordBankEntry, learnerLevel?: CEFRLevel): boolean {
  if (!learnerLevel || !entry.difficulty) return true
  return isCefrAppropriate(learnerLevel, normalizeCEFR(entry.difficulty))
}

/**
 * Filters to entries near the learner's level, falling back to the
 * unfiltered list when filtering would empty it out — an SRS-due word a
 * level away is still better than skipping review entirely.
 */
function preferLevelAppropriate(entries: WordBankEntry[], learnerLevel?: CEFRLevel): WordBankEntry[] {
  if (!learnerLevel) return entries
  const appropriate = entries.filter((entry) => isWithinLearnerLevel(entry, learnerLevel))
  return appropriate.length > 0 ? appropriate : entries
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
  learnerLevel,
}: DailyWordCandidates): DailyWordSelection {
  if (limit <= 0) return { words: [], savedOrFamiliarIds: new Set() }

  // Due SRS items keep their date regardless of level — only which OTHER
  // words fill the remaining slots is level-aware. A word a level away is
  // still shown if it's genuinely due; new/saved filler is not.
  const due = uniqueById(dueWords)
  const dueIds = new Set(due.map((word) => word.id))
  const boosted = preferLevelAppropriate(uniqueById(savedOrFamiliarWords), learnerLevel)
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

  for (const word of preferLevelAppropriate(uniqueById(newWords), learnerLevel)) {
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
