// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderGenericExercise } from '@/lib/practice/exercise-renderer/generic-registry'
import type { PersonalizationExercise } from '@/lib/exercises/types'

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

    const textarea = screen.getByPlaceholderText('Escribe aquí tu respuesta…')
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
})
