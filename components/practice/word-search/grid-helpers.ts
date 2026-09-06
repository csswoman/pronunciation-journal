import type { CellCoordinate } from '@/lib/exercises/word-search/types'

export function coordinateKey({ row, col }: CellCoordinate): string {
  return `${row}-${col}`
}

export function sameCoordinate(a: CellCoordinate, b: CellCoordinate): boolean {
  return a.row === b.row && a.col === b.col
}

export function triggerHaptic(pattern: number | number[] = 10) {
  if (
    typeof window !== 'undefined' &&
    'navigator' in window &&
    typeof navigator.vibrate === 'function'
  ) {
    try {
      navigator.vibrate(pattern)
    } catch {
      // Ignore when haptics are unsupported or disallowed
    }
  }
}

export function getCellFromPoint(
  clientX: number,
  clientY: number,
  size: number,
  container: HTMLElement | null,
): CellCoordinate | null {
  if (typeof document === 'undefined') return null
  const element = document.elementFromPoint(clientX, clientY)
  const cell = element?.closest<HTMLElement>('[data-cell-row]')
  if (!cell || !container?.contains(cell)) return null

  const row = Number.parseInt(cell.dataset.cellRow ?? '-1', 10)
  const col = Number.parseInt(cell.dataset.cellCol ?? '-1', 10)
  if (row < 0 || col < 0 || row >= size || col >= size) return null
  return { row, col }
}
