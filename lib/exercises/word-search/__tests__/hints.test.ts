import { describe, expect, it } from 'vitest'
import { getHintCells, pickHintTarget } from '../hints'
import type { WordPlacement } from '../types'

function placement(wordId: string, length: number, row = 0): WordPlacement {
  const path = Array.from({ length }, (_, col) => ({ row, col }))
  return {
    wordId,
    word: 'X'.repeat(length),
    start: path[0],
    end: path[length - 1],
    direction: [0, 1],
    path,
  }
}

describe('word-search letter hints', () => {
  const placements = [placement('cat', 3, 0), placement('horse', 5, 1)]

  it('reveals letters in reading order but never the whole word', () => {
    expect(getHintCells(placements[0], 0)).toEqual([])
    expect(getHintCells(placements[0], 1)).toEqual([{ row: 0, col: 0 }])
    expect(getHintCells(placements[0], 10)).toHaveLength(2)
  })

  it('keeps helping the current target while it still has hidden letters', () => {
    expect(pickHintTarget(['cat', 'horse'], { horse: 2 }, 'horse', placements)).toBe('horse')
  })

  it('moves to the least-hinted word once the target is exhausted or found', () => {
    expect(pickHintTarget(['cat', 'horse'], { cat: 2 }, 'cat', placements)).toBe('horse')
    expect(pickHintTarget(['horse'], { cat: 1 }, 'cat', placements)).toBe('horse')
    expect(pickHintTarget(['cat', 'horse'], { cat: 1 }, null, placements)).toBe('horse')
  })

  it('returns null when every unfound word is fully hinted', () => {
    expect(pickHintTarget(['cat'], { cat: 2 }, 'cat', placements)).toBeNull()
  })
})
