// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { RhythmicSentenceDisplay } from '../RhythmicSentenceDisplay'

vi.mock('@/lib/phoneme-practice/tts', () => ({
  speak: vi.fn(),
}))

import { speak } from '@/lib/phoneme-practice/tts'

describe('RhythmicSentenceDisplay', () => {
  it('renders sentence tokens with rhythm distinctions by default', () => {
    render(<RhythmicSentenceDisplay sentence="I want to go" />)

    expect(screen.getByText(/Ritmo del inglés/i)).toBeInTheDocument()
    expect(screen.getByText('want')).toBeInTheDocument()
    expect(screen.getByText('go')).toBeInTheDocument()
    expect(screen.getByText('I')).toBeInTheDocument()
    expect(screen.getByText('to')).toBeInTheDocument()

    // Legend should be present
    expect(screen.getByText(/Pulso:/i)).toBeInTheDocument()
  })

  it('toggles mode between rhythm and plain on button click', () => {
    render(<RhythmicSentenceDisplay sentence="I want to go" />)

    const toggleBtn = screen.getByRole('button', { name: /Ocultar compás/i })
    fireEvent.click(toggleBtn)

    expect(screen.getByRole('button', { name: /Ver compás/i })).toBeInTheDocument()
    expect(screen.queryByText(/Pulso:/i)).not.toBeInTheDocument()
  })

  it('triggers audio playback when clicking Escuchar ritmo', () => {
    render(<RhythmicSentenceDisplay sentence="I want to go" />)

    const audioBtn = screen.getByRole('button', { name: /Escuchar ritmo/i })
    fireEvent.click(audioBtn)

    expect(speak).toHaveBeenCalledWith('I want to go', expect.objectContaining({ rate: 0.9 }))
  })
})
