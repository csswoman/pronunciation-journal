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
      example_translation: 'Encontrar este café fue pura casualidad afortunada.',
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

const speakTextMock = vi.fn()
vi.mock('@/lib/speech/synthesis', () => ({
  speakText: (...args: unknown[]) => speakTextMock(...args),
}))

beforeEach(() => {
  playUiCue.mockClear()
  speakTextMock.mockClear()
})

describe('HomeWordOfDayCard', () => {
  it('plays the save cue and pops the bookmark when saved', async () => {
    render(<HomeWordOfDayCard />)

    const button = screen.getByRole('button', { name: 'Guardar palabra' })
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Guardada' })).toBeInTheDocument()
      expect(playUiCue).toHaveBeenCalledWith('save')
      expect(button.classList.contains('animate-heart-pop')).toBe(true)
    })
  })

  it('renders example section open by default, allows listening and shows translation', () => {
    render(<HomeWordOfDayCard />)

    // Example is visible by default
    expect(screen.getByText('Encontrar este café fue pura casualidad afortunada.')).toBeInTheDocument()

    // And the listen button should be visible
    const exampleSpeakButton = screen.getByRole('button', { name: 'Escuchar ejemplo' })
    expect(exampleSpeakButton).toBeInTheDocument()
    fireEvent.click(exampleSpeakButton)
    expect(speakTextMock).toHaveBeenCalledWith('Finding this cafe was pure serendipity.')

    // The whole word row is clickable to listen to pronunciation
    const wordSpeakButton = screen.getByRole('button', { name: 'Escuchar pronunciación de serendipity' })
    expect(wordSpeakButton).toBeInTheDocument()
    fireEvent.click(wordSpeakButton)
    expect(speakTextMock).toHaveBeenCalledWith('serendipity')
  })
})
