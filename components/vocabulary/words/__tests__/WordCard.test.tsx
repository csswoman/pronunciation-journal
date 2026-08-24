// @vitest-environment jsdom
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { WordCard } from '../WordCard'
import type { WordBankEntry } from '@/lib/word-bank/types'

const playUiCue = vi.fn()
vi.mock('@/lib/ui-sounds/cues', () => ({
  playUiCue: (...args: unknown[]) => playUiCue(...args),
}))

vi.mock('@/hooks/useAudioPlayback', () => ({
  useAudioPlayback: () => ({ play: vi.fn() }),
}))

const word: WordBankEntry = {
  id: 'w1',
  text: 'ephemeral',
  status: 'ready',
} as WordBankEntry

beforeEach(() => {
  playUiCue.mockClear()
})

describe('WordCard favorite heart', () => {
  it('plays the save cue and pops the heart when toggled to favorite', () => {
    const onToggleFavorite = vi.fn()
    render(
      <WordCard
        word={word}
        onRetry={vi.fn()}
        onDelete={vi.fn()}
        isFavorite={false}
        onToggleFavorite={onToggleFavorite}
      />,
    )

    const heartButton = screen.getByRole('button', { name: 'Add to favorites' })
    fireEvent.click(heartButton)

    expect(onToggleFavorite).toHaveBeenCalled()
    expect(playUiCue).toHaveBeenCalledWith('save')
    expect(heartButton.classList.contains('animate-heart-pop')).toBe(true)
  })

  it('does not play the save cue when toggling off a favorite', () => {
    const onToggleFavorite = vi.fn()
    render(
      <WordCard
        word={word}
        onRetry={vi.fn()}
        onDelete={vi.fn()}
        isFavorite={true}
        onToggleFavorite={onToggleFavorite}
      />,
    )

    const heartButton = screen.getByRole('button', { name: 'Remove from favorites' })
    fireEvent.click(heartButton)

    expect(onToggleFavorite).toHaveBeenCalled()
    expect(playUiCue).not.toHaveBeenCalled()
  })
})
