import { describe, expect, it } from 'vitest'
import {
  answerText,
  createBoard,
  isComplete,
  moveChip,
  nudgeChip,
  toggleChip,
  type BoardState,
} from '../reorder-board'

const TOKENS = ['Try', 'to', 'practice', 'to', 'learn']

function keysOf(state: BoardState, zone: 'bank' | 'answer'): string[] {
  return state[zone].map((chip) => chip.word)
}

describe('createBoard', () => {
  it('puts every token in the bank with a distinct key', () => {
    const board = createBoard(TOKENS)

    expect(board.answer).toEqual([])
    expect(keysOf(board, 'bank')).toEqual(TOKENS)
    expect(new Set(board.bank.map((c) => c.key)).size).toBe(TOKENS.length)
  })
})

describe('toggleChip', () => {
  it('moves a bank chip to the end of the answer and back', () => {
    const board = createBoard(['a', 'b'])
    const key = board.bank[1].key

    const placed = toggleChip(board, key)
    expect(keysOf(placed, 'answer')).toEqual(['b'])
    expect(keysOf(placed, 'bank')).toEqual(['a'])

    const returned = toggleChip(placed, key)
    expect(returned.answer).toEqual([])
    expect(keysOf(returned, 'bank')).toEqual(['a', 'b'])
  })

  it('ignores a key that is on neither list', () => {
    const board = createBoard(['a'])
    expect(toggleChip(board, 'missing')).toBe(board)
  })
})

describe('moveChip', () => {
  it('reorders within the answer', () => {
    let board = createBoard(['a', 'b', 'c'])
    for (const chip of [...board.bank]) board = toggleChip(board, chip.key)
    expect(keysOf(board, 'answer')).toEqual(['a', 'b', 'c'])

    const cKey = board.answer[2].key
    const moved = moveChip(board, cKey, 'answer', 0)
    expect(keysOf(moved, 'answer')).toEqual(['c', 'a', 'b'])
  })

  it('inserts at an exact index when coming from the bank', () => {
    let board = createBoard(['a', 'b', 'c'])
    board = toggleChip(board, board.bank[0].key)
    board = toggleChip(board, board.bank.find((c) => c.word === 'c')!.key)
    expect(keysOf(board, 'answer')).toEqual(['a', 'c'])

    const bKey = board.bank[0].key
    const moved = moveChip(board, bKey, 'answer', 1)
    expect(keysOf(moved, 'answer')).toEqual(['a', 'b', 'c'])
    expect(moved.bank).toEqual([])
  })

  it('clamps an index past the end instead of dropping the chip', () => {
    const board = createBoard(['a', 'b'])
    const moved = moveChip(board, board.bank[0].key, 'answer', 99)
    expect(keysOf(moved, 'answer')).toEqual(['a'])
  })

  it('keeps repeated words independent', () => {
    let board = createBoard(TOKENS)
    const [firstTo, secondTo] = board.bank.filter((c) => c.word === 'to')

    board = moveChip(board, secondTo.key, 'answer', 0)
    expect(keysOf(board, 'answer')).toEqual(['to'])
    expect(board.bank.some((c) => c.key === firstTo.key)).toBe(true)
    expect(board.bank.some((c) => c.key === secondTo.key)).toBe(false)
  })
})

describe('nudgeChip', () => {
  it('shifts a placed chip one position right', () => {
    let board = createBoard(['a', 'b'])
    for (const chip of [...board.bank]) board = toggleChip(board, chip.key)

    const nudged = nudgeChip(board, board.answer[0].key, 1)
    expect(keysOf(nudged, 'answer')).toEqual(['b', 'a'])
  })

  it('returns the first chip to the bank when nudged left', () => {
    let board = createBoard(['a', 'b'])
    for (const chip of [...board.bank]) board = toggleChip(board, chip.key)

    const nudged = nudgeChip(board, board.answer[0].key, -1)
    expect(keysOf(nudged, 'answer')).toEqual(['b'])
    expect(keysOf(nudged, 'bank')).toEqual(['a'])
  })

  it('does nothing past the right edge', () => {
    let board = createBoard(['a'])
    board = toggleChip(board, board.bank[0].key)
    expect(nudgeChip(board, board.answer[0].key, 1)).toBe(board)
  })

  it('ignores chips still in the bank', () => {
    const board = createBoard(['a'])
    expect(nudgeChip(board, board.bank[0].key, 1)).toBe(board)
  })
})

describe('answerText and isComplete', () => {
  it('joins placed chips in order', () => {
    let board = createBoard(['Try', 'it'])
    for (const chip of [...board.bank]) board = toggleChip(board, chip.key)
    expect(answerText(board)).toBe('Try it')
  })

  it('is complete only once the bank is empty', () => {
    let board = createBoard(['a', 'b'])
    expect(isComplete(board)).toBe(false)

    board = toggleChip(board, board.bank[0].key)
    expect(isComplete(board)).toBe(false)

    board = toggleChip(board, board.bank[0].key)
    expect(isComplete(board)).toBe(true)
  })

  it('is not complete on an untouched empty board', () => {
    expect(isComplete({ bank: [], answer: [] })).toBe(false)
  })
})
