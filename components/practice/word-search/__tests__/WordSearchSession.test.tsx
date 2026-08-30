// @vitest-environment jsdom

import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const fixtures = vi.hoisted(() => {
  const items = ['CAT', 'DOG', 'SUN'].map((word) => ({
    id: word.toLowerCase(),
    word,
    displayWord: word.toLowerCase(),
    clue: `${word} clue`,
    found: false,
    ipa: null,
  }))
  const placements = items.map((item, row) => ({
    wordId: item.id,
    word: item.word,
    start: { row, col: 0 },
    end: { row, col: 2 },
    direction: [0, 1] as [number, number],
    path: [
      { row, col: 0 },
      { row, col: 1 },
      { row, col: 2 },
    ],
  }))
  return {
    hideSessionChrome: vi.fn(),
    puzzle: {
      id: 'puzzle-test',
      title: 'Animales y naturaleza',
      topic: 'Prueba focalizada',
      source: 'curated' as const,
      mode: 'clues' as const,
      size: 3,
      grid: [
        ['C', 'A', 'T'],
        ['D', 'O', 'G'],
        ['S', 'U', 'N'],
      ],
      items,
      placements,
    },
  }
})

vi.mock('@/hooks/useHideMobileNavDuringSession', () => ({
  useHideMobileNavDuringSession: fixtures.hideSessionChrome,
}))

vi.mock('@/lib/ui-sounds/cues', () => ({
  playUiCue: vi.fn(),
}))

vi.mock('../WordSearchSetup', () => ({
  default: ({ onStartPuzzle }: { onStartPuzzle: (puzzle: typeof fixtures.puzzle) => void }) => (
    <button type="button" onClick={() => onStartPuzzle(fixtures.puzzle)}>
      Iniciar prueba
    </button>
  ),
}))

vi.mock('../WordSearchGrid', () => ({
  default: ({
    placements,
    onSelectPath,
  }: {
    placements: typeof fixtures.puzzle.placements
    onSelectPath: (path: Array<{ row: number; col: number }>) => void
  }) => (
    <div>
      {placements.map((placement) => (
        <button
          key={placement.wordId}
          type="button"
          onClick={() => onSelectPath(placement.path)}
        >
          Encontrar {placement.word}
        </button>
      ))}
    </div>
  ),
}))

vi.mock('../WordClueList', () => ({ default: () => null }))
vi.mock('../WordFoundBanner', () => ({ default: () => null }))

import WordSearchSession from '../WordSearchSession'

describe('WordSearchSession', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    fixtures.hideSessionChrome.mockClear()
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: vi.fn(),
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('resets the timer and session state when replaying the same board', () => {
    render(<WordSearchSession />)
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar prueba' }))

    act(() => {
      vi.advanceTimersByTime(2100)
    })
    expect(screen.getByLabelText('Tiempo transcurrido: 0:02')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Reiniciar este tablero' }))

    expect(screen.getByLabelText('Tiempo transcurrido: 0:00')).toBeInTheDocument()
    expect(fixtures.hideSessionChrome).toHaveBeenCalled()
  })

  it('derives completion from the words actually selected', () => {
    vi.stubGlobal('speechSynthesis', { speak: vi.fn(), cancel: vi.fn() })
    render(<WordSearchSession />)
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar prueba' }))

    fireEvent.click(screen.getByRole('button', { name: 'Encontrar CAT' }))
    fireEvent.click(screen.getByRole('button', { name: 'Encontrar DOG' }))
    fireEvent.click(screen.getByRole('button', { name: 'Encontrar SUN' }))

    expect(
      screen.getByRole('heading', { name: /¡Encontraste todas/ }),
    ).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '3')
    expect(screen.getByRole('region', { name: 'Resultados de la partida' })).toBeInTheDocument()
  })
})
