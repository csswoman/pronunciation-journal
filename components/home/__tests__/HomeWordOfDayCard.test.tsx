// @vitest-environment jsdom
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import HomeWordOfDayCard from '../HomeWordOfDayCard'

const playUiCue = vi.fn()
vi.mock('@/lib/ui-sounds/cues', () => ({
  playUiCue: (...args: unknown[]) => playUiCue(...args),
}))

vi.mock('@/components/auth/AuthProvider', () => ({
  useAuth: () => ({ user: { id: 'u1' } }),
}))

vi.mock('@/hooks/useWordOfDay', () => ({
  useWordOfDay: () => ({
    word: {
      word: 'serendipity',
      ipa: '/ˌserənˈdɪpɪti/',
      definition: 'a happy accident',
      example_sentence: 'Finding this cafe was pure serendipity.',
    },
    loading: false,
    error: null,
    refresh: vi.fn(),
  }),
}))

vi.mock('@/lib/word-bank/queries', () => ({
  quickAddWord: vi.fn().mockResolvedValue({ id: 'w1' }),
  toggleFavorite: vi.fn().mockResolvedValue(undefined),
}))

beforeEach(() => {
  playUiCue.mockClear()
})

describe('HomeWordOfDayCard favorite heart', () => {
  it('plays the save cue and pops the heart when saved', async () => {
    render(<HomeWordOfDayCard />)

    const button = screen.getByRole('button', { name: 'Guardar palabra' })
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Guardada' })).toBeInTheDocument()
    })

    expect(playUiCue).toHaveBeenCalledWith('save')
    expect(button.classList.contains('animate-heart-pop')).toBe(true)
  })
})
