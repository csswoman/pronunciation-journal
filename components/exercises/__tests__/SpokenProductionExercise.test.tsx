// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const speechInputMocks = vi.hoisted(() => ({
  useSpeechInput: vi.fn(),
}))
const micMocks = vi.hoisted(() => ({
  release: vi.fn(),
}))
const gradingMocks = vi.hoisted(() => ({
  gradeProduction: vi.fn(),
}))

vi.mock('@/hooks/useSpeechInput', () => speechInputMocks)
vi.mock('@/hooks/useSharedMicStream', () => ({
  useSharedMicStream: () => ({ getStream: vi.fn(), release: micMocks.release }),
}))
vi.mock('@/lib/exercises/grade-production-client', () => ({
  gradeProduction: gradingMocks.gradeProduction,
  isOnline: () => true,
  ProductionGradeError: class ProductionGradeError extends Error {},
}))
vi.mock('@/lib/phoneme-practice/tts', () => ({ speak: vi.fn() }))

import { SpokenProductionExercise } from '../SpokenProductionExercise'

const exercise = {
  id: 'spoken-production-1',
  type: 'spoken_production' as const,
  taskPrompt: 'Di una oración usando "controlled component".',
  targetItem: 'controlled component',
  targetMeaning: 'A React component whose state is controlled by props.',
  sourceRef: { source: 'word_bank' as const, id: 'word-1' },
  exerciseType: { domain: 'vocabulary' as const, mode: 'speak' as const, variant: 'sentence' as const },
}

describe('SpokenProductionExercise', () => {
  it('uses speech input with sentence endpoint and prioritizes retry when the target was not recognized', async () => {
    speechInputMocks.useSpeechInput.mockReturnValue({
      state: 'done',
      result: { transcript: 'Insurance Company', source: 'gemini' },
      error: null,
      isSupported: true,
      start: vi.fn(),
      stop: vi.fn(),
      reset: vi.fn(),
    })
    gradingMocks.gradeProduction.mockResolvedValue({
      correct: false,
      usedTarget: false,
      grammaticallyCorrect: false,
      constraintMet: true,
      score: 0,
      feedback: 'Try using the target phrase in a sentence.',
    })

    render(<SpokenProductionExercise exercise={exercise} onResult={vi.fn()} />)

    await waitFor(() => {
      expect(gradingMocks.gradeProduction).toHaveBeenCalledWith(expect.objectContaining({
        modality: 'spoken',
        production: 'Insurance Company',
      }))
    })

    expect(speechInputMocks.useSpeechInput).toHaveBeenCalledWith(
      expect.objectContaining({
        prefer: 'auto',
        endpoint: '/api/gemini/transcribe-sentence',
      }),
    )
    expect(screen.getByRole('button', { name: 'Intentar de nuevo' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Continuar de todos modos' })).toBeInTheDocument()
  })

  it('renders mic controls and keeps them accessible during listening and errors', () => {
    speechInputMocks.useSpeechInput.mockReturnValue({
      state: 'listening',
      result: null,
      error: null,
      isSupported: true,
      start: vi.fn(),
      stop: vi.fn(),
      reset: vi.fn(),
    })

    const { rerender } = render(<SpokenProductionExercise exercise={exercise} onResult={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Detener grabación' })).toBeInTheDocument()
    expect(screen.getByText(/Escuchando… habla en voz alta/i)).toBeInTheDocument()

    speechInputMocks.useSpeechInput.mockReturnValue({
      state: 'error',
      result: null,
      error: 'no-speech',
      isSupported: true,
      start: vi.fn(),
      stop: vi.fn(),
      reset: vi.fn(),
    })

    rerender(<SpokenProductionExercise exercise={exercise} onResult={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Grabar mi voz' })).toBeInTheDocument()
    expect(screen.getByText(/No se detectó voz/i)).toBeInTheDocument()
  })
})
