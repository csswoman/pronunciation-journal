import type { CellCoordinate, WordPlacement } from './types'

/** Letters revealed per word by "Ver una letra"; the last letter is never given. */
export type WordSearchHintProgress = Record<string, number>

/**
 * Chooses which unfound word the next letter hint belongs to: keep helping the
 * word already being hinted, otherwise pick the unfound word with the fewest
 * revealed letters (ties broken by list order).
 */
export function pickHintTarget(
  unfoundWordIds: string[],
  progress: WordSearchHintProgress,
  currentTargetId: string | null,
  placements: WordPlacement[],
): string | null {
  const canReveal = (id: string) => {
    const placement = placements.find((item) => item.wordId === id)
    return Boolean(placement && (progress[id] ?? 0) < placement.path.length - 1)
  }

  if (currentTargetId && unfoundWordIds.includes(currentTargetId) && canReveal(currentTargetId)) {
    return currentTargetId
  }

  const revealable = unfoundWordIds.filter(canReveal)
  if (revealable.length === 0) return null
  return revealable.reduce((best, id) =>
    (progress[id] ?? 0) < (progress[best] ?? 0) ? id : best,
  )
}

/** Cells of the first `revealed` letters of a word, in reading order. */
export function getHintCells(
  placement: WordPlacement | undefined,
  revealed: number,
): CellCoordinate[] {
  if (!placement || revealed <= 0) return []
  return placement.path.slice(0, Math.min(revealed, placement.path.length - 1))
}
