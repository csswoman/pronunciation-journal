'use client'

// Planned structure:
// <WordSearchCell>
//   <LetterButton /> (botón accesible de celda con feedback háptico y táctil)
// </WordSearchCell>

import type { KeyboardEvent, PointerEvent } from 'react'
import type { CellCoordinate } from '@/lib/exercises/word-search/types'
import type { WordColorTheme } from '@/lib/exercises/word-search/word-colors'

export type CellVisualState =
  | 'idle'
  | 'tap-anchor'
  | 'selected'
  | 'active'
  | 'found'
  | 'invalid'
  | 'already-found'

interface Props {
  coordinate: CellCoordinate
  letter: string
  size: number
  state: CellVisualState
  colorTheme?: WordColorTheme
  isFocused: boolean
  onPointerDown: (event: PointerEvent<HTMLButtonElement>) => void
  onClick: () => void
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void
  onFocus: () => void
}

export default function WordSearchCell({
  coordinate,
  letter,
  size,
  state,
  colorTheme,
  isFocused,
  onPointerDown,
  onClick,
  onKeyDown,
  onFocus,
}: Props) {
  const { row, col } = coordinate
  const cellTextClass = size <= 9 ? 'text-body-md md:text-h4' : 'text-caption md:text-label'

  let visualClass =
    'border border-border-subtle/60 bg-surface-raised text-fg hover:bg-surface-base shadow-2xs'

  if (state === 'invalid') {
    visualClass = 'bg-error-soft text-error ring-2 ring-error/60'
  } else if (state === 'already-found') {
    visualClass = 'bg-warning-soft text-warning ring-2 ring-warning/60'
  } else if (state === 'tap-anchor') {
    visualClass =
      'bg-primary text-on-primary ring-2 ring-primary shadow-xs font-bold scale-[1.03] z-10'
  } else if (state === 'selected') {
    visualClass =
      'bg-primary-soft text-primary ring-2 ring-primary/60 font-bold scale-[1.02] z-10'
  } else if (state === 'active') {
    visualClass =
      'bg-primary-soft text-primary ring-2 ring-primary/40 font-bold scale-[1.01]'
  } else if (state === 'found' && colorTheme) {
    visualClass = `${colorTheme.gridBg} ${colorTheme.gridText} ${colorTheme.gridRing}`
  }

  const isSelected = state === 'selected' || state === 'tap-anchor'

  return (
    <button
      type="button"
      role="gridcell"
      data-cell-row={row}
      data-cell-col={col}
      data-state={state}
      tabIndex={isFocused ? 0 : -1}
      aria-label={`Fila ${row + 1}, columna ${col + 1}, letra ${letter}`}
      aria-selected={isSelected || undefined}
      onFocus={onFocus}
      onPointerDown={onPointerDown}
      onClick={onClick}
      onKeyDown={onKeyDown}
      className={`focus-ring relative flex aspect-square min-w-0 select-none items-center justify-center rounded-md font-mono font-bold uppercase transition-[background-color,color,box-shadow,transform] duration-150 ease-out-quart active:scale-[0.94] motion-reduce:transform-none sm:rounded-lg ${cellTextClass} ${visualClass}`}
    >
      {letter}
    </button>
  )
}
