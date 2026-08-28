// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { speak } from '@/lib/phoneme-practice/tts'
import { ProductionGradeError } from '@/lib/exercises/grade-production-client'
import { WrittenProductionExercise } from '../WrittenProductionExercise'
import type { WrittenProductionExercise as WrittenProductionExerciseType } from '@/lib/exercises/types'

const gradingMocks = vi.hoisted(() => ({
  gradeProduction: vi.fn(),
}))

vi.mock('@/lib/exercises/grade-production-client', () => ({
  gradeProduction: gradingMocks.gradeProduction,
  isOnline: () => true,
  ProductionGradeError: class ProductionGradeError extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'ProductionGradeError'
    }
  },
}))

vi.mock('@/lib/phoneme-practice/tts', () => ({
  speak: vi.fn(),
}))

const exercise: WrittenProductionExerciseType = {
  id: 'written-production-1',
  type: 'written_production',
  taskPrompt: 'Use "achieve" in an original sentence.',
  targetItem: 'achieve',
  targetMeaning: 'to succeed in doing something',
  exampleSentence: 'She worked hard to achieve her dreams.',
  level: 'B1',
  sourceRef: { source: 'word_bank', id: 'word-achieve' },
  exerciseType: { domain: 'vocabulary', mode: 'write', variant: 'sentence' },
}

describe('WrittenProductionExercise', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders target word, meaning, audio button, and input area', () => {
    render(<WrittenProductionExercise exercise={exercise} onResult={vi.fn()} onSkip={vi.fn()} />)

    expect(screen.getByText('Escribe tu oración')).toBeInTheDocument()
    expect(screen.getByText('Use "achieve" in an original sentence.')).toBeInTheDocument()
    expect(screen.getByText('achieve')).toBeInTheDocument()
    expect(screen.getByText('to succeed in doing something')).toBeInTheDocument()

    const listenBtn = screen.getByRole('button', { name: 'Escuchar achieve' })
    expect(listenBtn).toBeInTheDocument()
    fireEvent.click(listenBtn)
    expect(speak).toHaveBeenCalledWith('achieve')
  })

  it('updates word count when user types', () => {
    render(<WrittenProductionExercise exercise={exercise} onResult={vi.fn()} />)

    const textarea = screen.getByPlaceholderText('Escribe tu oración en inglés aquí…')
    fireEvent.change(textarea, { target: { value: 'I want to achieve greatness' } })

    expect(screen.getByText('5 palabras')).toBeInTheDocument()
  })

  it('submits production and shows feedback on success', async () => {
    const onResult = vi.fn()
    gradingMocks.gradeProduction.mockResolvedValueOnce({
      correct: true,
      usedTarget: true,
      grammaticallyCorrect: true,
      score: 95,
      feedback: 'Excellent use of the target word!',
      corrections: undefined,
    })

    render(<WrittenProductionExercise exercise={exercise} onResult={onResult} />)

    const textarea = screen.getByPlaceholderText('Escribe tu oración en inglés aquí…')
    fireEvent.change(textarea, { target: { value: 'We will achieve our goals together.' } })

    const submitBtn = screen.getByRole('button', { name: 'Enviar' })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(gradingMocks.gradeProduction).toHaveBeenCalledWith(expect.objectContaining({
        targetItem: 'achieve',
        production: 'We will achieve our goals together.',
        modality: 'written',
      }))
    })

    expect(screen.getByText('Excellent use of the target word!')).toBeInTheDocument()

    const continueBtn = screen.getByRole('button', { name: 'Continuar' })
    fireEvent.click(continueBtn)
    expect(onResult).toHaveBeenCalledWith(true, 'We will achieve our goals together.', expect.any(Number), expect.objectContaining({
      score: 95,
    }))
  })

  it('handles AI service failure gracefully and allows self-check with example', async () => {
    const onResult = vi.fn()
    gradingMocks.gradeProduction.mockRejectedValueOnce(
      new ProductionGradeError('El servicio de corrección con IA no está disponible en este momento.', 'server')
    )

    render(<WrittenProductionExercise exercise={exercise} onResult={onResult} />)

    const textarea = screen.getByPlaceholderText('Escribe tu oración en inglés aquí…')
    fireEvent.change(textarea, { target: { value: 'I achieve high scores.' } })

    const submitBtn = screen.getByRole('button', { name: 'Enviar' })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText('El servicio de corrección con IA no está disponible en este momento.')).toBeInTheDocument()
    })

    const selfCheckBtn = screen.getByRole('button', { name: 'Autoevaluar con ejemplo' })
    expect(selfCheckBtn).toBeInTheDocument()

    fireEvent.click(selfCheckBtn)
    expect(onResult).toHaveBeenCalledWith(true, 'I achieve high scores.', expect.any(Number), expect.objectContaining({
      resultStatus: 'unscored',
    }))
  })

  it('calls onSkip when user clicks skip button', () => {
    const onSkip = vi.fn()
    render(<WrittenProductionExercise exercise={exercise} onResult={vi.fn()} onSkip={onSkip} />)

    const skipBtn = screen.getByRole('button', { name: 'Omitir este ejercicio' })
    fireEvent.click(skipBtn)
    expect(onSkip).toHaveBeenCalled()
  })
})
