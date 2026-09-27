'use client'

import { useMemo, useState } from 'react'
import type { CellCoordinate, WordSearchPuzzle } from '@/lib/exercises/word-search/types'
import {
  getHintCells,
  pickHintTarget,
  type WordSearchHintProgress,
} from '@/lib/exercises/word-search/hints'

/**
 * "Ver una letra" state for one board: reveals one more letter of a single
 * unfound word per tap, never the whole word.
 */
export function useWordSearchHints(
  puzzle: WordSearchPuzzle | null,
  foundWordIds: Set<string>,
) {
  const [progress, setProgress] = useState<WordSearchHintProgress>({})
  const [targetId, setTargetId] = useState<string | null>(null)

  const activeTargetId = targetId && !foundWordIds.has(targetId) ? targetId : null

  const hintCells = useMemo<CellCoordinate[]>(() => {
    if (!puzzle || !activeTargetId) return []
    const placement = puzzle.placements.find((item) => item.wordId === activeTargetId)
    return getHintCells(placement, progress[activeTargetId] ?? 0)
  }, [activeTargetId, progress, puzzle])

  /** Reveals the next letter; returns the hinted word id, or null if none left. */
  const revealLetter = (): string | null => {
    if (!puzzle) return null
    const unfound = puzzle.items
      .filter((item) => !foundWordIds.has(item.id))
      .map((item) => item.id)
    const next = pickHintTarget(unfound, progress, activeTargetId, puzzle.placements)
    if (!next) return null
    setTargetId(next)
    setProgress((current) => ({ ...current, [next]: (current[next] ?? 0) + 1 }))
    return next
  }

  const resetHints = () => {
    setProgress({})
    setTargetId(null)
  }

  return { hintCells, hintTargetId: activeTargetId, hintProgress: progress, revealLetter, resetHints }
}
