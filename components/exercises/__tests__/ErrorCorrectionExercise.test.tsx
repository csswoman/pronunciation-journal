// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '@/lib/db'
import { ErrorCorrectionExercise } from '../ErrorCorrectionExercise'
import type { ErrorCorrectionExercise as ErrorCorrectionExerciseType } from '@/lib/exercises/types'

const baseExercise: ErrorCorrectionExerciseType = {
  id: 'ec-test-1',
  type: 'error_correction',
  sentence: 'She am a teacher.',
  correctSentence: 'She is a teacher.',
  explanation: 'Use is for she/he/it.',
  sourceRef: { source: 'grammar_deck', id: 'deck-1' },
}

describe('ErrorCorrectionExercise', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    await db.gradedAnswers.clear()
  })

  it('accepts contracted form She\'s a teacher as a valid variant', async () => {
    const onResult = vi.fn()
    render(<ErrorCorrectionExercise exercise={baseExercise} onResult={onResult} />)

    const input = screen.getByPlaceholderText('Escribe la corrección aquí…')
    fireEvent.change(input, { target: { value: "She's a teacher" } })

    const submitBtn = screen.getByRole('button', { name: 'Comprobar' })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(onResult).toHaveBeenCalledWith(
        true,
        "She's a teacher",
        expect.any(Number),
        expect.objectContaining({
          score: 100,
          feedback: expect.objectContaining({
            canRetry: false,
          }),
        }),
      )
    })
  })

  it('shows and handles "Está correcta" when alreadyCorrect is true', async () => {
    const onResult = vi.fn()
    const alreadyCorrectEx: ErrorCorrectionExerciseType = {
      ...baseExercise,
      id: 'ec-test-correct',
      sentence: 'She is a doctor.',
      correctSentence: 'She is a doctor.',
      alreadyCorrect: true,
      level: 'A2',
    }

    render(<ErrorCorrectionExercise exercise={alreadyCorrectEx} onResult={onResult} />)

    const correctBtn = screen.getByRole('button', { name: 'Está correcta' })
    expect(correctBtn).toBeInTheDocument()

    fireEvent.click(correctBtn)

    await waitFor(() => {
      expect(onResult).toHaveBeenCalledWith(
        true,
        'She is a doctor.',
        expect.any(Number),
        expect.objectContaining({
          score: 100,
          feedback: expect.objectContaining({
            immediate: '¡Correcto! Esta oración ya era correcta.',
          }),
        }),
      )
    })
  })

  it('clicking "Está correcta" when the sentence has an error reveals correction on exhausted attempts', async () => {
    const onResult = vi.fn()
    const wrongEx: ErrorCorrectionExerciseType = {
      ...baseExercise,
      id: 'ec-test-wrong-a2',
      sentence: 'She am a teacher.',
      correctSentence: 'She is a teacher.',
      alreadyCorrect: false,
      level: 'A2', // level A2 drill shows "Está correcta" to not spoil the answer, 1 attempt
    }

    render(<ErrorCorrectionExercise exercise={wrongEx} onResult={onResult} />)

    const correctBtn = screen.getByRole('button', { name: 'Está correcta' })
    expect(correctBtn).toBeInTheDocument()

    fireEvent.click(correctBtn)

    // In A2 (maxAttempts: 1), clicking it fails and exhausts attempts -> shows SelfAssessPrompt
    await waitFor(() => {
      expect(screen.getByRole('region', { name: 'Autoevaluación de respuesta' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Me equivoqué' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Mi respuesta también es correcta' })).toBeInTheDocument()
    })
  })

  it('handles "Mi respuesta también es correcta", persists to Dexie, and accepts it subsequently', async () => {
    const onResult = vi.fn()
    render(<ErrorCorrectionExercise exercise={baseExercise} onResult={onResult} />)

    const input = screen.getByPlaceholderText('Escribe la corrección aquí…')
    fireEvent.change(input, { target: { value: 'She works as a teacher' } })

    const submitBtn = screen.getByRole('button', { name: 'Comprobar' })
    fireEvent.click(submitBtn)

    // Level not set -> maxAttempts defaults to 1 -> shows SelfAssessPrompt
    await waitFor(() => {
      expect(screen.getByRole('region', { name: 'Autoevaluación de respuesta' })).toBeInTheDocument()
    })

    const selfApproveBtn = screen.getByRole('button', { name: 'Mi respuesta también es correcta' })
    fireEvent.click(selfApproveBtn)

    await waitFor(() => {
      expect(onResult).toHaveBeenCalledWith(
        true,
        'She works as a teacher',
        expect.any(Number),
        expect.objectContaining({
          score: 70,
          resultStatus: 'unscored',
        }),
      )
    })

    // Check that Dexie has the record
    const saved = await db.gradedAnswers.where('exerciseKey').equals(baseExercise.id).toArray()
    expect(saved.length).toBe(1)
    expect(saved[0].normalized).toBe('she works as a teacher')
    expect(saved[0].accepted).toBe(1)
  })
})
