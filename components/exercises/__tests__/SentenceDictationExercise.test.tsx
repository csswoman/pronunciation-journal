// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SentenceDictationExercise } from '../SentenceDictationExercise'
import type { SentenceDictationExercise as SentenceDictationExerciseType } from '@/lib/exercises/types'

vi.mock('@/hooks/useUISounds', () => ({
  useUISounds: () => ({
    playTap: vi.fn(),
    playCorrect: vi.fn(),
    playWrong: vi.fn(),
  }),
}))

describe('SentenceDictationExercise', () => {
  const sampleExercise: SentenceDictationExerciseType = {
    id: 'test-sd-1',
    type: 'sentence_dictation',
    sourceRef: { source: 'word_bank', id: 'wb-1' },
    sentence: 'She writes a letter today',
    audioUrl: null,
    targetWord: 'writes',
    targetMeaning: 'escribe cartas',
  }

  let onResultMock = vi.fn<
    (isCorrect: boolean, userAnswer: string, timeMs: number, extras?: { feedback?: unknown }) => void
  >()

  beforeEach(() => {
    onResultMock = vi.fn()
  })

  it('renders audio buttons, word count badge and answer input', () => {
    render(<SentenceDictationExercise exercise={sampleExercise} onResult={onResultMock} />)

    expect(screen.getByRole('button', { name: /escuchar oración/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /escuchar despacio/i })).toBeInTheDocument()
    expect(screen.getByText('5 palabras')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/escribe lo que escuchas/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /comprobar/i })).toBeInTheDocument()
  })

  it('handles correct answer submission', () => {
    render(<SentenceDictationExercise exercise={sampleExercise} onResult={onResultMock} />)

    const textarea = screen.getByPlaceholderText(/escribe lo que escuchas/i)
    fireEvent.change(textarea, { target: { value: 'She writes a letter today' } })

    fireEvent.click(screen.getByRole('button', { name: /comprobar/i }))

    expect(onResultMock).toHaveBeenCalledWith(
      true,
      'She writes a letter today',
      expect.any(Number),
      expect.objectContaining({
        feedback: expect.anything(),
      }),
    )
    expect(screen.getByText('¡Muy bien!')).toBeInTheDocument()
  })

  it('handles incorrect answer submission with feedback diff', () => {
    render(<SentenceDictationExercise exercise={sampleExercise} onResult={onResultMock} />)

    const textarea = screen.getByPlaceholderText(/escribe lo que escuchas/i)
    fireEvent.change(textarea, { target: { value: 'She reads a letter today' } })

    fireEvent.click(screen.getByRole('button', { name: /comprobar/i }))

    expect(onResultMock).toHaveBeenCalledWith(
      false,
      'She reads a letter today',
      expect.any(Number),
      expect.anything(),
    )
    expect(screen.getByText(/esta es la oración correcta/i)).toBeInTheDocument()
  })

  it('displays structured hint tokens when hintCount > 0', () => {
    const { rerender } = render(
      <SentenceDictationExercise exercise={sampleExercise} onResult={onResultMock} hintCount={0} />,
    )

    expect(screen.queryByText(/pista de palabras/i)).not.toBeInTheDocument()

    rerender(
      <SentenceDictationExercise exercise={sampleExercise} onResult={onResultMock} hintCount={1} />,
    )

    expect(screen.getByText(/pista de palabras/i)).toBeInTheDocument()
    expect(screen.getByText('S')).toBeInTheDocument()
    expect(screen.getByText('w')).toBeInTheDocument()
    expect(screen.getByText(/escribe cartas/i)).toBeInTheDocument()
  })
})
