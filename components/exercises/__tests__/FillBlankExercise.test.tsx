// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FillBlankExercise } from '../FillBlankExercise'
import type { FillBlankExercise as FillBlankExerciseType } from '@/lib/exercises/types'

vi.mock('@/hooks/useUISounds', () => ({
  useUISounds: () => ({
    playTap: vi.fn(),
    playCorrect: vi.fn(),
    playWrong: vi.fn(),
  }),
}))

describe('FillBlankExercise', () => {
  const sampleExercise: FillBlankExerciseType = {
    id: 'test-fb-1',
    type: 'fill_blank',
    sourceRef: { source: 'word_bank', id: 'wb-1' },
    sentence: 'I ___ apples every morning.',
    answer: 'eat',
    options: ['eat', 'ate', 'eating', 'eats'],
    hint: 'Acción habitual o rutina en presente simple.',
    hints: {
      level1: 'Pista contextual: Acción habitual ("every morning") con sujeto "I".',
      level2: 'Forma verbal: Forma base del verbo.',
      level3: 'Traducción: "Yo como manzanas todas las mañanas."',
    },
  }

  let onResultMock = vi.fn<
    (isCorrect: boolean, userAnswer: string, timeMs: number, extras?: { feedback?: unknown }) => void
  >()

  beforeEach(() => {
    onResultMock = vi.fn()
  })

  it('renders sentence prompt and option buttons', () => {
    render(<FillBlankExercise exercise={sampleExercise} onResult={onResultMock} />)

    expect(screen.getByText(/I/)).toBeInTheDocument()
    expect(screen.getByText(/apples every morning\./)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'eat' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'ate' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'eating' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'eats' })).toBeInTheDocument()
  })

  it('handles selecting the correct answer', () => {
    render(<FillBlankExercise exercise={sampleExercise} onResult={onResultMock} />)

    fireEvent.click(screen.getByRole('button', { name: 'eat' }))

    expect(onResultMock).toHaveBeenCalledWith(
      true,
      'eat',
      expect.any(Number),
      expect.objectContaining({
        feedback: expect.objectContaining({
          immediate: 'Sí, esa palabra completa la oración.',
        }),
      }),
    )
  })

  it('handles selecting an incorrect answer', () => {
    render(<FillBlankExercise exercise={sampleExercise} onResult={onResultMock} />)

    fireEvent.click(screen.getByRole('button', { name: 'ate' }))

    expect(onResultMock).toHaveBeenCalledWith(
      false,
      'ate',
      expect.any(Number),
      expect.objectContaining({
        feedback: expect.objectContaining({
          immediate: 'Aún no. Elige la palabra que haga que la oración suene natural.',
        }),
      }),
    )
  })

  it('displays progressive hint ladder when hintCount advances', () => {
    const { rerender } = render(
      <FillBlankExercise exercise={sampleExercise} onResult={onResultMock} hintCount={0} />,
    )

    expect(screen.queryByText(/Pista contextual/)).not.toBeInTheDocument()

    // Advance to Level 1
    rerender(
      <FillBlankExercise exercise={sampleExercise} onResult={onResultMock} hintCount={1} />,
    )
    expect(screen.getByText(/Pista contextual/)).toBeInTheDocument()
    expect(screen.getByText(/Pista 1 de 3/)).toBeInTheDocument()

    // Advance to Level 2
    rerender(
      <FillBlankExercise exercise={sampleExercise} onResult={onResultMock} hintCount={2} />,
    )
    expect(screen.getByText(/Forma base del verbo/)).toBeInTheDocument()
    expect(screen.getByText(/Pista 2 de 3/)).toBeInTheDocument()

    // Advance to Level 3
    rerender(
      <FillBlankExercise exercise={sampleExercise} onResult={onResultMock} hintCount={3} />,
    )
    expect(screen.getByText(/Yo como manzanas/)).toBeInTheDocument()
    expect(screen.getByText(/Pista 3 de 3/)).toBeInTheDocument()
  })

  it('supports number key shortcuts (1-4)', () => {
    render(<FillBlankExercise exercise={sampleExercise} onResult={onResultMock} />)

    fireEvent.keyDown(window, { key: '1' })

    expect(onResultMock).toHaveBeenCalledWith(
      true,
      'eat',
      expect.any(Number),
      expect.anything(),
    )
  })
})
