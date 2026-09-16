/**
 * Pure board state for the reorder-words exercise.
 *
 * The component owns pointer events and rendering; every rule about where a
 * chip may land lives here so it can be tested without a DOM. Chips carry a
 * stable `key` because the same word can appear twice in one sentence
 * ("to practice ... to learn") and positions must stay distinguishable.
 */

export interface BoardChip {
  key: string
  word: string
}

export interface BoardState {
  /** Chips still available, in tray order. */
  bank: BoardChip[]
  /** Chips placed by the learner, in answer order. */
  answer: BoardChip[]
}

export type BoardZone = 'bank' | 'answer'

export function createBoard(tokens: string[]): BoardState {
  return {
    bank: tokens.map((word, index) => ({ key: `${word}-${index}`, word })),
    answer: [],
  }
}

function locate(state: BoardState, key: string): { zone: BoardZone; index: number } | null {
  const answerIndex = state.answer.findIndex((chip) => chip.key === key)
  if (answerIndex !== -1) return { zone: 'answer', index: answerIndex }
  const bankIndex = state.bank.findIndex((chip) => chip.key === key)
  if (bankIndex !== -1) return { zone: 'bank', index: bankIndex }
  return null
}

/**
 * Move `key` to `index` within `zone`.
 *
 * `index` is interpreted against the list *after* the chip is removed, which
 * is what a drop between two chips means visually. An out-of-range index
 * clamps to the nearest end rather than failing, so a drop past the last chip
 * appends instead of doing nothing.
 */
export function moveChip(
  state: BoardState,
  key: string,
  zone: BoardZone,
  index: number,
): BoardState {
  const from = locate(state, key)
  if (!from) return state

  const chip = state[from.zone][from.index]
  const bank = [...state.bank]
  const answer = [...state.answer]
  const source = from.zone === 'bank' ? bank : answer
  source.splice(from.index, 1)

  const target = zone === 'bank' ? bank : answer
  const clamped = Math.max(0, Math.min(index, target.length))
  target.splice(clamped, 0, chip)

  return { bank, answer }
}

/** Tap behaviour: a chip toggles between the tray and the end of the answer. */
export function toggleChip(state: BoardState, key: string): BoardState {
  const from = locate(state, key)
  if (!from) return state
  return from.zone === 'bank'
    ? moveChip(state, key, 'answer', state.answer.length)
    : moveChip(state, key, 'bank', state.bank.length)
}

/**
 * Shift a placed chip one position left or right.
 *
 * Keyboard users get this instead of dragging. Moving left from the first
 * position returns the chip to the tray, mirroring what dragging it out does.
 */
export function nudgeChip(state: BoardState, key: string, direction: -1 | 1): BoardState {
  const from = locate(state, key)
  if (!from || from.zone !== 'answer') return state

  const next = from.index + direction
  if (next < 0) return moveChip(state, key, 'bank', state.bank.length)
  if (next >= state.answer.length) return state
  return moveChip(state, key, 'answer', next)
}

export function answerText(state: BoardState): string {
  return state.answer.map((chip) => chip.word).join(' ')
}

/** True once every chip is placed, which is when the answer can be graded. */
export function isComplete(state: BoardState): boolean {
  return state.bank.length === 0 && state.answer.length > 0
}
