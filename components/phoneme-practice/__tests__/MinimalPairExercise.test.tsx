// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MinimalPairExercise } from '../MinimalPairExercise'

const { speak } = vi.hoisted(() => ({ speak: vi.fn() }))

vi.mock('@/lib/phoneme-practice/tts', () => ({ speak }))

const exercise = {
  type: 'minimal_pair' as const,
  soundId: 1,
  ipa: '/ʌ/',
  targetWord: 'done',
  options: [
    { id: 'a', label: 'down', isCorrect: false },
    { id: 'b', label: 'done', isCorrect: true },
  ],
  correctIds: ['b'],
}

describe('MinimalPairExercise', () => {
  beforeEach(() => speak.mockClear())

  it('plays the target word rather than trying to pronounce the IPA symbol', async () => {
    const user = userEvent.setup()
    render(
      <MinimalPairExercise exercise={exercise} onSubmit={vi.fn()} focusUi />,
    )

    await user.click(screen.getByRole('button', { name: 'Play sound' }))

    expect(speak).toHaveBeenCalledWith('done', { voice: undefined })
  })

  it('does not reveal an option audio when selecting it', async () => {
    const user = userEvent.setup()
    render(
      <MinimalPairExercise exercise={exercise} onSubmit={vi.fn()} focusUi />,
    )

    await user.click(screen.getByRole('radio', { name: 'Seleccionar down' }))

    expect(speak).not.toHaveBeenCalled()
  })

  it('evaluates the target sound and explains the word-to-IPA relationship', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(
      <MinimalPairExercise exercise={exercise} onSubmit={onSubmit} focusUi />,
    )

    await user.click(screen.getByRole('radio', { name: 'Seleccionar down' }))
    await user.click(screen.getByRole('button', { name: 'Check' }))

    expect(onSubmit).toHaveBeenCalledWith(false, 'down')
    expect(screen.getByText('La respuesta es “done”.')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(
      'done contiene el sonido /ʌ/. “down” usa un sonido diferente.',
    )
  })
})
