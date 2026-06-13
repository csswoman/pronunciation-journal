// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { CoreWord } from '@/lib/core-1000/types'

const WORDS: CoreWord[] = [
  {
    rank: 1, word: 'the', pos: 'article', ipa_strong: '/ðʌ/', ipa_weak: '/ðə/',
    example_sentence: 'Give me the book please.', sentence_ipa: '/ɡɪv mi ðə bʊk pliz/', cefr_level: 'A1',
  },
  {
    rank: 2, word: 'be', pos: 'verb', ipa_strong: '/biː/',
    example_sentence: 'I want to be happy.', cefr_level: 'A1',
  },
]

vi.mock('@/lib/core-1000/client', () => ({
  fetchCoreWords: vi.fn(async () => WORDS),
}))

const dbMocks = vi.hoisted(() => ({
  getCore1000SrsEntries: vi.fn(async (): Promise<never[]> => []),
  getCore1000IntroducedToday: vi.fn(async (): Promise<string[]> => []),
  recordCore1000Introduction: vi.fn(async () => undefined),
  getSRSData: vi.fn(async () => undefined),
  saveSRSData: vi.fn(async () => undefined),
  saveAttempt: vi.fn(async () => undefined),
  updateDailyProgress: vi.fn(async () => undefined),
  updateUserStats: vi.fn(async () => undefined),
}))
vi.mock('@/lib/db', () => dbMocks)

vi.mock('@/lib/phoneme-practice/tts', () => ({
  speak: vi.fn(),
  getEnglishVoices: vi.fn(() => []),
  invalidateVoiceCache: vi.fn(),
}))

vi.mock('@/hooks/useSharedMicStream', () => ({
  useSharedMicStream: () => ({
    getStream: vi.fn(async () => ({ getTracks: () => [] })),
    release: vi.fn(),
  }),
}))

vi.mock('@/hooks/useSpeechInput', () => ({
  useSpeechInput: () => ({
    state: 'idle',
    result: null,
    error: null,
    isSupported: false,
    start: vi.fn(),
    stop: vi.fn(),
    abort: vi.fn(),
    reset: vi.fn(),
  }),
}))

import { Core1000Session } from '../Core1000Session'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('Core1000Session', () => {
  it('introduces a new card as study first, then speak with self-grade fallback', async () => {
    const user = userEvent.setup()
    render(<Core1000Session />)

    await screen.findByRole('heading', { name: 'the' })
    expect(screen.getByText('/ðʌ/')).toBeTruthy()
    expect(screen.getByText('/ðə/')).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Practicar' }))

    expect(await screen.findByText('Give me the book please.')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Bien' }))

    await waitFor(() => expect(dbMocks.saveSRSData).toHaveBeenCalledOnce())
    expect(dbMocks.recordCore1000Introduction).toHaveBeenCalledWith('the')
    await screen.findByRole('heading', { name: 'be' })
  })

  it('shows the empty state when there is nothing due and no quota left', async () => {
    dbMocks.getCore1000IntroducedToday.mockResolvedValue(
      Array.from({ length: 10 }, (_, i) => `w${i}`)
    )
    render(<Core1000Session />)
    expect(await screen.findByText('Nada pendiente por hoy')).toBeTruthy()
  })
})
