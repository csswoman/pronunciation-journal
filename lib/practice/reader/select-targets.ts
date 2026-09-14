import type { CEFRLevel } from '@/lib/exercises/cefr'

export interface ReaderTargetRow {
  srsId: string
  word: string
  status: string
  nextReview: string
  /** SRS difficulty rating (1-5). `0`/undefined means unvetted — see hasUnvettedDifficulty. */
  difficulty?: number
}

export interface ReaderTarget {
  srsId: string
  word: string
}

const MIN_TARGETS = 3
const MAX_TARGETS = 8

/**
 * True when a row has no real difficulty rating: `0` (word_bank's insert
 * default for a word saved without a rated difficulty — dictionary lookup,
 * AI Coach, any non-curated source) or missing entirely. Mirrors
 * `hasUnvettedDifficulty` in lib/exercises/generators/production.ts.
 */
function hasUnvettedDifficulty(row: ReaderTargetRow): boolean {
  return !row.difficulty
}

/**
 * A reader passage is comprehensible input: every target word gets woven
 * into the story, so an unvetted word (see hasUnvettedDifficulty) is a real
 * risk at A1/A2 — a technical or niche term saved out of curiosity (e.g. a
 * programming-glossary word) can slip into a "beginner" story. An UNKNOWN
 * learner level is treated the same as A1/A2, not as "no restriction": the
 * moment level is unknown is the first session, exactly when an inappropriate
 * word does the most damage. Higher levels keep the word.
 */
function isSafeForReader(row: ReaderTargetRow, learnerLevel?: CEFRLevel): boolean {
  if (learnerLevel && learnerLevel !== 'A1' && learnerLevel !== 'A2') return true
  return !hasUnvettedDifficulty(row)
}

/**
 * Pure selection: keep learning/review rows that are safe for the learner's
 * level, order by soonest due, cap at 8. Returns null when fewer than 3
 * qualify (no reader that day).
 */
export function pickTargets(rows: ReaderTargetRow[], learnerLevel?: CEFRLevel): ReaderTarget[] | null {
  const eligible = rows
    .filter((r) => (r.status === 'learning' || r.status === 'review') && isSafeForReader(r, learnerLevel))
    .sort((a, b) => {
      if (!a.nextReview) return b.nextReview ? 1 : 0
      if (!b.nextReview) return -1
      return a.nextReview.localeCompare(b.nextReview)
    })
    .slice(0, MAX_TARGETS)
    .map(({ srsId, word }) => ({ srsId, word }))
  return eligible.length >= MIN_TARGETS ? eligible : null
}
