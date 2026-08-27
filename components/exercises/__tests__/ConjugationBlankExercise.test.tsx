// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ConjugationBlankExercise } from '../ConjugationBlankExercise'
import type { ConjugationBlankExercise as ConjugationBlankExerciseType } from '@/lib/exercises/types'

const playCorrectMock = vi.fn()
const playWrongMock = vi.fn()

vi.mock('@/hooks/useUISounds', () => ({
  useUISounds: () => ({
    playTap: vi.fn(),
    playCorrect: playCorrectMock,
    playWrong: playWrongMock,
  }),
}))

describe('ConjugationBlankExercise', () => {
  const sampleExercise: ConjugationBlankExerciseType = {
    id: 'test-cb-1',
    type: 'conjugation_blank',
    sourceRef: { source: 'word_bank', id: 'wb-1' },
    sentence: 'She ___ to work every day.',
    lemma: 'go',
    answer: 'goes',
    hint: 'Tercera persona singular (he/she/it) en presente simple.',
    acceptedAnswers: ['goes'],
  }

  let onResultMock = vi.fn<
    (isCorrect: boolean, userAnswer: string, timeMs: number, extras?: { feedback?: unknown }) => void
  >()

  beforeEach(() => {
    vi.clearAllMocks()
    onResultMock = vi.fn()
  })

  it('renders sentence prompt and infinitive lemma', () => {
    render(<ConjugationBlankExercise exercise={sampleExercise} onResult={onResultMock} />)

    expect(screen.getByText('She ___ to work every day.')).toBeInTheDocument()
    expect(screen.getByText('go')).toBeInTheDocument()
    expect(screen.getByLabelText('Forma verbal')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Comprobar' })).toBeInTheDocument()
  })

  it('handles submitting the correct answer', () => {
    render(<ConjugationBlankExercise exercise={sampleExercise} onResult={onResultMock} />)

    const input = screen.getByLabelText('Forma verbal')
    fireEvent.change(input, { target: { value: 'goes' } })
    fireEvent.click(screen.getByRole('button', { name: 'Comprobar' }))

    expect(playCorrectMock).toHaveBeenCalled()
    expect(onResultMock).toHaveBeenCalledWith(
      true,
      'goes',
      expect.any(Number),
      expect.objectContaining({
        feedback: expect.objectContaining({
          immediate: 'Correcto.',
        }),
      }),
    )
  })

  it('handles submitting an incorrect answer', () => {
    render(<ConjugationBlankExercise exercise={sampleExercise} onResult={onResultMock} />)

    const input = screen.getByLabelText('Forma verbal')
    fireEvent.change(input, { target: { value: 'go' } })
    fireEvent.click(screen.getByRole('button', { name: 'Comprobar' }))

    expect(playWrongMock).toHaveBeenCalled()
    expect(onResultMock).toHaveBeenCalledWith(
      false,
      'go',
      expect.any(Number),
      expect.objectContaining({
        feedback: expect.objectContaining({
          immediate: 'Revisa la forma verbal.',
          expectedAnswer: 'goes',
        }),
      }),
    )
  })

  it('submits on Enter key press when input is non-empty', () => {
    render(<ConjugationBlankExercise exercise={sampleExercise} onResult={onResultMock} />)

    const input = screen.getByLabelText('Forma verbal')
    fireEvent.change(input, { target: { value: 'goes' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(onResultMock).toHaveBeenCalledWith(
      true,
      'goes',
      expect.any(Number),
      expect.anything(),
    )
  })

  it('displays hint progressively when hintCount advances', () => {
    const { rerender } = render(
      <ConjugationBlankExercise exercise={sampleExercise} onResult={onResultMock} hintCount={0} />,
    )

    expect(screen.queryByText(/Tercera persona singular/)).not.toBeInTheDocument()

    // Advance to Hint Level 1
    rerender(
      <ConjugationBlankExercise exercise={sampleExercise} onResult={onResultMock} hintCount={1} />,
    )
    expect(screen.getByText('Tercera persona singular (he/she/it) en presente simple.')).toBeInTheDocument()
    expect(screen.getByText('Pista 1 de 2')).toBeInTheDocument()

    // Advance to Hint Level 2 (reveals first letter clue)
    rerender(
      <ConjugationBlankExercise exercise={sampleExercise} onResult={onResultMock} hintCount={2} />,
    )
    expect(screen.getByText(/Empieza por "g…" \(4 letras\)\./)).toBeInTheDocument()
    expect(screen.getByText('Pista 2 de 2')).toBeInTheDocument()
  })

  it('displays fallback letter hint when exercise has no authored hint', () => {
    const noHintExercise: ConjugationBlankExerciseType = {
      id: 'test-cb-no-hint',
      type: 'conjugation_blank',
      sourceRef: { source: 'word_bank', id: 'wb-2' },
      sentence: 'They ___ dinner.',
      lemma: 'cook',
      answer: 'cooked',
    }

    const { rerender } = render(
      <ConjugationBlankExercise exercise={noHintExercise} onResult={onResultMock} hintCount={0} />,
    )
    expect(screen.queryByText(/Empieza por/)).not.toBeInTheDocument()

    rerender(
      <ConjugationBlankExercise exercise={noHintExercise} onResult={onResultMock} hintCount={1} />,
    )
    expect(screen.getByText('Empieza por "c…" (6 letras).')).toBeInTheDocument()
  })
})
