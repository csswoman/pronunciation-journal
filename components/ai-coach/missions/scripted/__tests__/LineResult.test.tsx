// components/ai-coach/missions/scripted/__tests__/LineResult.test.tsx
// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { LineResult } from '../LineResult'
import type { WordResult } from '@/lib/types'

vi.mock('@/lib/phoneme-practice/tts', () => ({ speak: vi.fn() }))

const wordResults: WordResult[] = [
  { expected: 'goes', got: 'goes', status: 'correct' },
  { expected: 'home', got: '', status: 'missing' },
]

describe('LineResult', () => {
  it('counts the words that went well', () => {
    render(<LineResult wordResults={wordResults} userAudioUrl={null} onRetry={vi.fn()} onContinue={vi.fn()} />)
    expect(screen.getByText('1 de 2 palabras bien')).toBeInTheDocument()
  })

  it('wires retry and continue to the footer actions', () => {
    const onRetry = vi.fn()
    const onContinue = vi.fn()
    render(<LineResult wordResults={wordResults} userAudioUrl={null} onRetry={onRetry} onContinue={onContinue} />)

    fireEvent.click(screen.getByRole('button', { name: /repetir frase/i }))
    expect(onRetry).toHaveBeenCalledTimes(1)

    // Una sola palabra por mejorar ⇒ el segundo botón sale del turno.
    fireEvent.click(screen.getByRole('button', { name: /continuar/i }))
    expect(onContinue).toHaveBeenCalledTimes(1)
  })
})
