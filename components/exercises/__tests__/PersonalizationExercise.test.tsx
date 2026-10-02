// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderGenericExercise } from '@/lib/practice/exercise-renderer/generic-registry'
import type { PersonalizationExercise } from '@/lib/exercises/types'

const aiMocks = vi.hoisted(() => ({ gradeProduction: vi.fn() }))
vi.mock('@/lib/exercises/grade-production-client', async importOriginal => ({
  ...await importOriginal<typeof import('@/lib/exercises/grade-production-client')>(),
  gradeProduction: aiMocks.gradeProduction,
}))

const frameExercise: PersonalizationExercise = {
  id: 'pers-frame-1',
  type: 'personalization',
  mode: 'frame',
  frame: "I am ___ years old.",
  slot: 'number',
  sourceRef: { source: 'grammar_deck', id: 'deck-1' },
}

const openExercise: PersonalizationExercise = {
  id: 'pers-open-1',
  type: 'personalization',
  mode: 'open',
  promptEs: '¿Qué harías si ganaras la lotería?',
  requires: ['second_conditional'],
  minWords: 6,
  maxWords: 20,
  sourceRef: { source: 'grammar_deck', id: 'deck-1' },
}

describe('PersonalizationExercise', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    aiMocks.gradeProduction.mockReset().mockResolvedValue({
      correct: true, usedTarget: true, grammaticallyCorrect: true, constraintMet: true,
      score: 100, feedback: 'Tu oración está bien.',
    })
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
  })

  it('renders frame mode via generic registry and completes successfully', async () => {
    const onResult = vi.fn()
    render(
      renderGenericExercise(frameExercise, {
        onResult,
      }),
    )

    expect(screen.getByText('Habla de ti')).toBeInTheDocument()
    expect(screen.getByText('I am')).toBeInTheDocument()
    expect(screen.getByText('years old.')).toBeInTheDocument()

    const input = screen.getByRole('textbox', { name: 'Espacio a completar' })
    fireEvent.change(input, { target: { value: '25' } })

    const submitBtn = screen.getByRole('button', { name: 'Comprobar' })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(onResult).toHaveBeenCalledWith(
        true,
        'I am 25 years old.',
        expect.any(Number),
        expect.objectContaining({
          score: 100,
          resultStatus: 'unscored', // without requires, unscored in A1
        }),
      )
    })
  })

  it('renders open mode via generic registry with live structure chips', async () => {
    const onResult = vi.fn()
    render(
      renderGenericExercise(openExercise, {
        onResult,
      }),
    )

    expect(screen.getByText('¿Qué harías si ganaras la lotería?')).toBeInTheDocument()
    expect(screen.getByText(/second conditional/i)).toBeInTheDocument()

    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, {
      target: { value: 'If I won the lottery, I would buy a big house.' },
    })

    const submitBtn = screen.getByRole('button', { name: 'Comprobar' })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(onResult).toHaveBeenCalledWith(
        true,
        'If I won the lottery, I would buy a big house.',
        expect.any(Number),
        expect.objectContaining({
          score: 100,
          resultStatus: 'answered', // with requires, answered
        }),
      )
    })
  })

  it('does not show "Pulir con IA" when offline', async () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
    const onResult = vi.fn()

    render(
      renderGenericExercise(frameExercise, {
        onResult,
      }),
    )

    const input = screen.getByRole('textbox', { name: 'Espacio a completar' })
    fireEvent.change(input, { target: { value: '30' } })

    const submitBtn = screen.getByRole('button', { name: 'Comprobar' })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(onResult).toHaveBeenCalled()
    })

    expect(screen.queryByRole('button', { name: 'Pulir con IA' })).not.toBeInTheDocument()
  })

  it('serves repeated polishing from the local cache without another AI call', async () => {
    render(renderGenericExercise(frameExercise, { onResult: vi.fn() }))
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '25' } })
    fireEvent.click(screen.getByRole('button', { name: 'Comprobar' }))
    for (let i = 0; i < 2; i++) {
      fireEvent.click(screen.getByRole('button', { name: 'Pulir con IA' }))
      await screen.findByText('Tu oración está bien.')
    }
    expect(aiMocks.gradeProduction).toHaveBeenCalledOnce()
  })

  it('shows a recoverable polishing error rather than silently hiding it', async () => {
    aiMocks.gradeProduction.mockRejectedValueOnce(new Error('provider unavailable'))
    render(renderGenericExercise(frameExercise, { onResult: vi.fn() }))
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '25' } })
    fireEvent.click(screen.getByRole('button', { name: 'Comprobar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Pulir con IA' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo corregir')
  })
})
