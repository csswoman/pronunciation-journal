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

const coreWordClientMocks = vi.hoisted(() => ({
  fetchCoreWords: vi.fn(async () => WORDS),
}))

vi.mock('@/lib/core-1000/client', () => ({
  fetchCoreWords: coreWordClientMocks.fetchCoreWords,
}))

const dbMocks = vi.hoisted(() => ({
  getCore1000SrsEntries: vi.fn(async (): Promise<never[]> => []),
  getCore1000IntroducedToday: vi.fn(async (): Promise<string[]> => []),
  recordCore1000Introduction: vi.fn(async () => undefined),
  archiveCore1000Word: vi.fn(async () => undefined),
  getSRSData: vi.fn(async () => undefined),
  saveSRSData: vi.fn(async () => undefined),
  saveAttempt: vi.fn(async () => undefined),
  updateDailyProgress: vi.fn(async () => undefined),
  updateUserStats: vi.fn(async () => undefined),
}))
vi.mock('@/lib/db', () => dbMocks)

const authMocks = vi.hoisted(() => ({
  user: null as { id: string } | null,
}))

const activityMocks = vi.hoisted(() => ({
  recordActivitySession: vi.fn(async () => ({ reconciledStepIds: [] })),
}))

const syncMocks = vi.hoisted(() => ({
  flushOutbox: vi.fn(async () => undefined),
}))

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

vi.mock('@/components/auth/AuthProvider', () => ({
  useAuth: () => ({ user: authMocks.user }),
}))

vi.mock('@/lib/progress/activity-hub', () => ({
  recordActivitySession: activityMocks.recordActivitySession,
}))

vi.mock('@/lib/sync/sync-manager', () => ({
  flushOutbox: syncMocks.flushOutbox,
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

import { EssentialWordsSession } from '../EssentialWordsSession'

beforeEach(() => {
  vi.clearAllMocks()
  window.sessionStorage.clear()
  authMocks.user = null
  coreWordClientMocks.fetchCoreWords.mockResolvedValue(WORDS)
  dbMocks.getCore1000SrsEntries.mockResolvedValue([])
  dbMocks.getCore1000IntroducedToday.mockResolvedValue([])
  dbMocks.saveSRSData.mockResolvedValue(undefined)
})

describe('EssentialWordsSession', () => {
  it('introduces a new card as study first, then speak with self-grade fallback', async () => {
    const user = userEvent.setup()
    render(<EssentialWordsSession />)

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
    render(<EssentialWordsSession />)
    expect(await screen.findByText('Nada pendiente por hoy')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Ver mi progreso' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Ir al plan de hoy' })).toBeTruthy()
  })

  it('resumes on the first appended card when learning more after finishing', async () => {
    const user = userEvent.setup()
    dbMocks.getCore1000IntroducedToday.mockResolvedValue(
      Array.from({ length: 9 }, (_, i) => `w${i}`)
    )
    render(<EssentialWordsSession />)

    await screen.findByRole('heading', { name: 'the' })
    await user.click(screen.getByRole('button', { name: 'Practicar' }))
    await screen.findByText('Give me the book please.')
    await user.click(screen.getByRole('button', { name: 'Bien' }))

    await screen.findByText('Sesión completa')
    await user.click(screen.getByRole('button', { name: 'Aprender 10 nuevas más' }))

    expect(await screen.findByRole('heading', { name: 'be' })).toBeTruthy()
  })

  it('shows a reload state instead of empty when the dataset load fails', async () => {
    coreWordClientMocks.fetchCoreWords.mockRejectedValueOnce(new Error('offline'))

    render(<EssentialWordsSession />)

    expect(await screen.findByText('No se pudo cargar la sesión')).toBeTruthy()
    expect(screen.getByText('Revisa tu conexión o vuelve a intentar la carga.')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Continuar practicando' })).toBeTruthy()
  })

  it('persists pending lapses and flushes them on pagehide', async () => {
    const user = userEvent.setup()
    render(<EssentialWordsSession />)

    await screen.findByRole('heading', { name: 'the' })
    await user.click(screen.getByRole('button', { name: 'Practicar' }))
    await screen.findByText('Give me the book please.')
    await user.click(screen.getByRole('button', { name: 'Otra vez' }))

    expect(window.sessionStorage.getItem('core1000:pending-lapses')).toContain('"c1k:the"')

    window.dispatchEvent(new PageTransitionEvent('pagehide'))

    await waitFor(() => expect(dbMocks.saveSRSData).toHaveBeenCalledOnce())
    expect(window.sessionStorage.getItem('core1000:pending-lapses')).toBeNull()
  })

  it('records the finished session only once when the last card is archived', async () => {
    const user = userEvent.setup()
    authMocks.user = { id: 'user-1' }
    dbMocks.getCore1000IntroducedToday.mockResolvedValue(Array.from({ length: 9 }, (_, i) => `w${i}`))

    render(<EssentialWordsSession />)

    await screen.findByRole('heading', { name: 'the' })
    await user.click(screen.getByRole('button', { name: 'Ya la sé' }))

    await screen.findByText('Sesión completa')
    await waitFor(() => expect(activityMocks.recordActivitySession).toHaveBeenCalledTimes(1))
    expect(activityMocks.recordActivitySession).toHaveBeenCalledWith('user-1', expect.objectContaining({
      practiceContext: 'core-1000',
    }))
  })
})
