// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ListeningClozeCard } from '../ListeningClozeCard'
import type { EssentialWord } from '@/lib/essential-words/types'

vi.mock('@/lib/ui-sounds/cues', () => ({ playUiCue: vi.fn() }))
vi.mock('@/lib/phoneme-practice/tts', () => ({ speak: vi.fn() }))

const entry: EssentialWord = {
  rank: 1,
  word: 'work',
  pos: 'verb',
  ipa_strong: '/wɜrk/',
  example_sentence: 'She works at a hospital downtown every single day.',
  cefr_level: 'A1',
  meaning: 'to do a job',
  translation: 'trabajar',
}

describe('ListeningClozeCard', () => {
  it('uses sentence audio as the prompt while showing only the target blank', () => {
    render(<ListeningClozeCard entry={entry} onAttempt={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Escuchar' })).toBeInTheDocument()
    expect(screen.getByText(/She/)).toBeInTheDocument()
    expect(screen.getByLabelText('Escribe la palabra que escuchaste')).toHaveFocus()
  })

  it('writes listening and production evidence for an exact answer', () => {
    const onAttempt = vi.fn().mockResolvedValue(undefined)
    render(<ListeningClozeCard entry={entry} onAttempt={onAttempt} />)
    fireEvent.change(screen.getByLabelText('Escribe la palabra que escuchaste'), { target: { value: 'works' } })
    fireEvent.click(screen.getByRole('button', { name: 'Comprobar' }))
    expect(onAttempt).toHaveBeenCalledWith(expect.objectContaining({
      correct: true,
      evidencia: [
        { habilidad: 'listening', veredicto: 'acierto' },
        { habilidad: 'production', veredicto: 'acierto' },
      ],
    }))
  })

  it('does not fail listening for a typing error', () => {
    const onAttempt = vi.fn().mockResolvedValue(undefined)
    render(<ListeningClozeCard entry={entry} onAttempt={onAttempt} />)
    fireEvent.change(screen.getByLabelText('Escribe la palabra que escuchaste'), { target: { value: 'wroks' } })
    fireEvent.click(screen.getByRole('button', { name: 'Comprobar' }))
    expect(onAttempt).toHaveBeenCalledWith(expect.objectContaining({
      correct: false,
      evidencia: [
        { habilidad: 'listening', veredicto: 'acierto' },
        { habilidad: 'production', veredicto: 'fallo' },
      ],
    }))
  })

  it('records an unrecognized real word as a guess, without phonetic evidence', () => {
    const onAttempt = vi.fn().mockResolvedValue(undefined)
    render(<ListeningClozeCard entry={entry} onAttempt={onAttempt} />)
    fireEvent.change(screen.getByLabelText('Escribe la palabra que escuchaste'), { target: { value: 'sleep' } })
    fireEvent.click(screen.getByRole('button', { name: 'Comprobar' }))
    expect(onAttempt).toHaveBeenCalledWith(expect.objectContaining({
      errorDominante: 'guess',
      evidencia: [],
    }))
  })
})
