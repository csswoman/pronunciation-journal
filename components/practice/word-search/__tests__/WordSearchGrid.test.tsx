// @vitest-environment jsdom

import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import WordSearchGrid from '../WordSearchGrid'
import type {
  CellCoordinate,
  WordPlacement,
  WordSelectionResult,
} from '@/lib/exercises/word-search/types'

const grid = [
  ['C', 'A', 'T'],
  ['D', 'O', 'G'],
  ['S', 'U', 'N'],
]

const placements: WordPlacement[] = [
  {
    wordId: 'cat',
    word: 'CAT',
    start: { row: 0, col: 0 },
    end: { row: 0, col: 2 },
    direction: [0, 1],
    path: [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
    ],
  },
]

function renderGrid(
  onSelectPath: (path: CellCoordinate[]) => WordSelectionResult = vi.fn<
    (path: CellCoordinate[]) => WordSelectionResult
  >(() => 'found'),
) {
  render(
    <WordSearchGrid
      grid={grid}
      placements={placements}
      foundWordIds={new Set()}
      activeWordId={null}
      onSelectPath={onSelectPath}
    />,
  )
  return onSelectPath
}

describe('WordSearchGrid', () => {
  it('supports selecting a word by activating its first and last cells', () => {
    const onSelectPath = renderGrid()

    fireEvent.click(
      screen.getByRole('gridcell', {
        name: 'Fila 1, columna 1, letra C',
      }),
    )
    fireEvent.click(
      screen.getByRole('gridcell', {
        name: 'Fila 1, columna 3, letra T',
      }),
    )

    expect(onSelectPath).toHaveBeenCalledWith(placements[0].path)
  })

  it('uses a single tab stop and moves focus with arrow keys', () => {
    renderGrid()
    const first = screen.getByRole('gridcell', {
      name: 'Fila 1, columna 1, letra C',
    })
    const second = screen.getByRole('gridcell', {
      name: 'Fila 1, columna 2, letra A',
    })

    first.focus()
    fireEvent.keyDown(first, { key: 'ArrowRight' })

    expect(second).toHaveFocus()
    expect(first).toHaveAttribute('tabindex', '-1')
    expect(second).toHaveAttribute('tabindex', '0')
  })

  it('shows semantic error feedback for a non-straight selection', () => {
    const onSelectPath = vi.fn(() => 'invalid' as const)
    renderGrid(onSelectPath)

    fireEvent.click(
      screen.getByRole('gridcell', {
        name: 'Fila 1, columna 1, letra C',
      }),
    )
    fireEvent.click(
      screen.getByRole('gridcell', {
        name: 'Fila 2, columna 3, letra G',
      }),
    )

    expect(onSelectPath).toHaveBeenCalledWith([])
    expect(document.querySelectorAll('[data-state="invalid"]')).toHaveLength(2)
  })
})
