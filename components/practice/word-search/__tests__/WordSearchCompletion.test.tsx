// @vitest-environment jsdom

import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import WordSearchCompletion from '../WordSearchCompletion'
import type { WordSearchPuzzle } from '@/lib/exercises/word-search/types'

const recordWordSearchRepetition = vi.fn()
vi.mock('@/lib/word-bank/domain-queries', () => ({
  recordWordSearchRepetition: (...args: unknown[]) => recordWordSearchRepetition(...args),
}))

vi.mock('@/components/auth/AuthProvider', () => ({
  useAuthOptional: () => ({ user: { id: 'test-user-uuid' } }),
}))

const mockPuzzle: WordSearchPuzzle = {
  id: 'puzzle-wb-1',
  title: 'Mis palabras guardadas',
  topic: 'Vocabulario personal',
  source: 'word_bank',
  mode: 'clues',
  size: 4,
  grid: [
    ['C', 'A', 'T', 'S'],
    ['D', 'O', 'G', 'S'],
    ['S', 'U', 'N', 'S'],
    ['M', 'O', 'O', 'N'],
  ],
  items: [
    { id: 'wb-1', word: 'CATS', displayWord: 'cats', clue: 'Felines', found: true, ipa: '/kæts/' },
    { id: 'wb-2', word: 'DOGS', displayWord: 'dogs', clue: 'Canines', found: true, ipa: '/dɔːɡz/' },
  ],
  placements: [],
}

describe('WordSearchCompletion', () => {
  beforeEach(() => {
    recordWordSearchRepetition.mockReset()
  })

  it('renders completion screen and records word_bank repetitions', async () => {
    recordWordSearchRepetition.mockResolvedValue(2)

    render(
      <WordSearchCompletion
        puzzle={mockPuzzle}
        elapsedSeconds={45}
        formatTime={(s) => `${s}s`}
        onRepeat={vi.fn()}
        onExit={vi.fn()}
      />
    )

    expect(screen.getByText('¡Encontraste todas las palabras!')).toBeInTheDocument();
    expect(screen.getByText('cats')).toBeInTheDocument();
    expect(screen.getByText('dogs')).toBeInTheDocument();

    await waitFor(() => {
      expect(recordWordSearchRepetition).toHaveBeenCalledWith(
        'test-user-uuid',
        [
          { id: 'wb-1', word: 'CATS', clue: 'Felines' },
          { id: 'wb-2', word: 'DOGS', clue: 'Canines' },
        ],
        45000,
      )
    })

    await waitFor(() => {
      expect(screen.getByText(/2 palabras repasadas en SRS/i)).toBeInTheDocument();
    })
  })
})
