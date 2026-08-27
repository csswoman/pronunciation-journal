// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SentenceTransformationExercise } from '../SentenceTransformationExercise'
import type { SentenceTransformationExercise as SentenceTransformationExerciseType } from '@/lib/exercises/types'

const gradingMocks = vi.hoisted(() => ({
  gradeProduction: vi.fn(),
}))

vi.mock('@/lib/exercises/grade-production-client', () => ({
  gradeProduction: gradingMocks.gradeProduction,
  ProductionGradeError: class ProductionGradeError extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'ProductionGradeError'
    }
  },
}))

const exercise: SentenceTransformationExerciseType = {
  id: 'st-test-1',
  type: 'sentence_transformation',
  sourceSentence: 'She is too tired to work.',
  instruction: 'Rewrite using enough.',
  referenceAnswer: 'She is not well enough to work.',
  sourceRef: { source: 'text_fragments', id: 'st-test-1' },
}

describe('SentenceTransformationExercise', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
  })

  it('renders source sentence and instruction', () => {
    render(<SentenceTransformationExercise exercise={exercise} onResult={vi.fn()} onSkip={vi.fn()} />)

    expect(screen.getByText('Oración original')).toBeInTheDocument()
    expect(screen.getByText('She is too tired to work.')).toBeInTheDocument()
    expect(screen.getByText('Rewrite using enough.')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Escribe la nueva oración…')).toBeInTheDocument()
  })

  it('immediately validates exact match without calling gradeProduction', () => {
    const onResult = vi.fn()
    render(<SentenceTransformationExercise exercise={exercise} onResult={onResult} />)

    const textarea = screen.getByPlaceholderText('Escribe la nueva oración…')
    fireEvent.change(textarea, { target: { value: 'she is not well enough to work' } })

    const submitBtn = screen.getByRole('button', { name: 'Comprobar' })
    fireEvent.click(submitBtn)

    expect(gradingMocks.gradeProduction).not.toHaveBeenCalled()
    expect(onResult).toHaveBeenCalledWith(
      true,
      'she is not well enough to work',
      expect.any(Number),
      expect.objectContaining({
        score: 100,
        feedback: expect.objectContaining({
          immediate: '¡Correcto!',
          expectedAnswer: 'She is not well enough to work.',
        }),
      }),
    )
  })

  it('calls gradeProduction with referenceAnswer and returns referenceAnswer in feedback on error', async () => {
    const onResult = vi.fn()
    gradingMocks.gradeProduction.mockResolvedValueOnce({
      correct: false,
      usedTarget: false,
      grammaticallyCorrect: true,
      score: 40,
      feedback: 'Revisa el significado de la oración.',
      corrections: 'She is not too tired to work.',
      errorPattern: 'vocabulary_choice',
    })

    render(<SentenceTransformationExercise exercise={exercise} onResult={onResult} />)

    const textarea = screen.getByPlaceholderText('Escribe la nueva oración…')
    fireEvent.change(textarea, { target: { value: 'she is tired enough to work' } })

    const submitBtn = screen.getByRole('button', { name: 'Comprobar' })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(gradingMocks.gradeProduction).toHaveBeenCalledWith(
        expect.objectContaining({
          targetItem: 'She is not well enough to work.',
          production: 'she is tired enough to work',
          modality: 'written',
        }),
      )
    })

    expect(onResult).toHaveBeenCalledWith(
      false,
      'she is tired enough to work',
      expect.any(Number),
      expect.objectContaining({
        score: 40,
        feedback: expect.objectContaining({
          expectedAnswer: 'She is not well enough to work.',
          correction: 'She is not well enough to work.',
        }),
      }),
    )
  })

  it('shows error when offline and not matching reference answer', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
    const onResult = vi.fn()

    render(<SentenceTransformationExercise exercise={exercise} onResult={onResult} />)

    const textarea = screen.getByPlaceholderText('Escribe la nueva oración…')
    fireEvent.change(textarea, { target: { value: 'she is tired enough' } })

    const submitBtn = screen.getByRole('button', { name: 'Comprobar' })
    fireEvent.click(submitBtn)

    expect(screen.getByRole('alert')).toHaveTextContent('Sin conexión. Respuesta de referencia: She is not well enough to work.')
    expect(onResult).not.toHaveBeenCalled()
  })

  it('calls onSkip when clicking skip button', () => {
    const onSkip = vi.fn()
    render(<SentenceTransformationExercise exercise={exercise} onResult={vi.fn()} onSkip={onSkip} />)

    const skipBtn = screen.getByRole('button', { name: 'Omitir este ejercicio' })
    fireEvent.click(skipBtn)
    expect(onSkip).toHaveBeenCalledTimes(1)
  })
})
