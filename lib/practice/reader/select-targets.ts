export interface ReaderTargetRow {
  srsId: string
  word: string
  status: string
  nextReview: string
}

export interface ReaderTarget {
  srsId: string
  word: string
}

const MIN_TARGETS = 3
const MAX_TARGETS = 8

/**
 * Pure selection: keep learning/review rows, order by soonest due, cap at 8.
 * Returns null when fewer than 3 qualify (no reader that day).
 */
export function pickTargets(rows: ReaderTargetRow[]): ReaderTarget[] | null {
  const eligible = rows
    .filter((r) => r.status === 'learning' || r.status === 'review')
    .sort((a, b) => a.nextReview.localeCompare(b.nextReview))
    .slice(0, MAX_TARGETS)
    .map(({ srsId, word }) => ({ srsId, word }))
  return eligible.length >= MIN_TARGETS ? eligible : null
}
