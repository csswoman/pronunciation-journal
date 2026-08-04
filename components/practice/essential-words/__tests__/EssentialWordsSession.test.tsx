// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { EssentialWord } from '@/lib/essential-words/types'
import type { SRSData } from '@/lib/types'

const WORDS: EssentialWord[] = [
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
  fetchEssentialWords: vi.fn(async () => WORDS),
}))

vi.mock('@/lib/essential-words/client', () => ({
  fetchEssentialWords: coreWordClientMocks.fetchEssentialWords,
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), refresh: vi.fn() }),
}))

const dbMocks = vi.hoisted(() => ({
  getEssentialWordsSrsEntries: vi.fn(async (): Promise<SRSData[]> => []),
  getEssentialWordsIntroducedToday: vi.fn(async (): Promise<string[]> => []),
  recordEssentialWordIntroduction: vi.fn(async () => undefined),
  snoozeEssentialWord: vi.fn(async () => undefined),
  masterEssentialWord: vi.fn(async () => undefined),
  getSRSData: vi.fn(async () => undefined),
  saveSRSData: vi.fn(async () => undefined),
  saveAttempt: vi.fn(async () => undefined),
  updateDailyProgress: vi.fn(async () => undefined),
  updateUserStats: vi.fn(async () => undefined),
  migrateArchivedSrsRows: vi.fn(async () => undefined),
}))
vi.mock('@/lib/db', () => ({
  db: {
    srsData: {
      put: dbMocks.saveSRSData,
    },
  },
  ...dbMocks,
}))

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
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: window.sessionStorage,
  })
  window.sessionStorage.clear()
  authMocks.user = { id: 'user-1' }
  coreWordClientMocks.fetchEssentialWords.mockResolvedValue(WORDS)
  dbMocks.getEssentialWordsSrsEntries.mockResolvedValue([])
  dbMocks.getEssentialWordsIntroducedToday.mockResolvedValue([])
  dbMocks.saveSRSData.mockResolvedValue(undefined)
})

describe('EssentialWordsSession', () => {
  it('renders the exposure phase before any exercise for a batch of new words (Fase A block structure)', async () => {
    dbMocks.getEssentialWordsSrsEntries.mockResolvedValue([])
    dbMocks.getEssentialWordsIntroducedToday.mockResolvedValue([])

    render(<EssentialWordsSession />)

    expect(await screen.findByRole('heading', { name: WORDS[0].word })).toBeTruthy()
  })

  it('shows only the loader during loading — no session chrome/header', async () => {
    coreWordClientMocks.fetchEssentialWords.mockImplementation(
      () => new Promise(() => {}),
    )

    render(<EssentialWordsSession />)

    expect(await screen.findByText('Preparando tu sesión')).toBeTruthy()
    expect(screen.queryByText('Palabras esenciales')).toBeNull()
    expect(screen.queryByLabelText(/baúl/i)).toBeNull()
  })

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
    expect(dbMocks.recordEssentialWordIntroduction).toHaveBeenCalledWith('the', 'user-1')
    await screen.findByRole('heading', { name: 'be' })
  })

  it('shows the empty state when there is nothing due and no quota left', async () => {
    dbMocks.getEssentialWordsIntroducedToday.mockResolvedValue(
      Array.from({ length: 10 }, (_, i) => `w${i}`)
    )
    render(<EssentialWordsSession />)
    expect(await screen.findByText('Nada pendiente por hoy')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Ver progreso' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Abrir plan de hoy' })).toBeTruthy()
  })

  it('resumes on the first appended card when learning more after finishing', async () => {
    const user = userEvent.setup()
    dbMocks.getEssentialWordsIntroducedToday.mockResolvedValue(
      Array.from({ length: 9 }, (_, i) => `w${i}`)
    )
    render(<EssentialWordsSession />)

    await screen.findByRole('heading', { name: 'the' })
    await user.click(screen.getByRole('button', { name: 'Practicar' }))
    await screen.findByText('Give me the book please.')
    await user.click(screen.getByRole('button', { name: 'Bien' }))

    await screen.findByText(/Sesión completa/)
    await user.click(screen.getByRole('button', { name: 'Aprender 10 nuevas más' }))

    expect(await screen.findByRole('heading', { name: 'be' })).toBeTruthy()
  })

  it('shows a reload state instead of empty when the dataset load fails', async () => {
    coreWordClientMocks.fetchEssentialWords.mockRejectedValueOnce(new Error('offline'))

    render(<EssentialWordsSession />)

    expect(await screen.findByText('No se pudo cargar la sesión')).toBeTruthy()
    expect(screen.getByText('Revisa tu conexión o vuelve a intentar la carga.')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Reintentar carga' })).toBeTruthy()
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
    expect(dbMocks.saveSRSData).toHaveBeenCalledWith(expect.objectContaining({
      wordId: 'c1k:the',
      word: 'the',
      interval: 1,
      repetitions: 0,
      ease: 1.96,
    }), 'user-1')
    expect(window.sessionStorage.getItem('core1000:pending-lapses')).toBeNull()
  })

  it('records the finished session only once when the last card is archived', async () => {
    const user = userEvent.setup()
    dbMocks.getEssentialWordsIntroducedToday.mockResolvedValue(Array.from({ length: 9 }, (_, i) => `w${i}`))

    render(<EssentialWordsSession />)

    await screen.findByRole('heading', { name: 'the' })
    await user.click(screen.getByRole('button', { name: 'Ya la sé' }))
    await user.click(screen.getByRole('button', { name: 'Sí, pausar' }))

    await screen.findByText(/Sesión completa/)
    await waitFor(() => expect(activityMocks.recordActivitySession).toHaveBeenCalledTimes(1))
    expect(activityMocks.recordActivitySession).toHaveBeenCalledWith('user-1', expect.objectContaining({
      practiceContext: 'essential-words',
    }))
  })

  it('offers keep/master actions for words reactivated from snooze', async () => {
    const user = userEvent.setup()
    dbMocks.getEssentialWordsSrsEntries.mockResolvedValue([
      {
        wordId: 'c1k:the',
        word: 'the',
        interval: 1,
        ease: 2.5,
        repetitions: 1,
        nextReview: '2026-07-01T00:00:00.000Z',
        status: 'snoozed',
        snoozedAt: '2026-01-01T00:00:00.000Z',
      },
    ])

    render(<EssentialWordsSession />)

    expect(await screen.findByText('Give me the book please.')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Seguir en 90 días' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'No me la recuerdes más' })).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Seguir en 90 días' }))

    await waitFor(() => expect(dbMocks.snoozeEssentialWord).toHaveBeenCalledWith('the', 90, 'user-1'))
    await screen.findByRole('heading', { name: 'be' })
  })

  it('masters a reactivated snooze word and advances', async () => {
    const user = userEvent.setup()
    dbMocks.getEssentialWordsSrsEntries.mockResolvedValue([
      {
        wordId: 'c1k:the',
        word: 'the',
        interval: 1,
        ease: 2.5,
        repetitions: 1,
        nextReview: '2026-07-01T00:00:00.000Z',
        status: 'snoozed',
        snoozedAt: '2026-01-01T00:00:00.000Z',
      },
    ])

    render(<EssentialWordsSession />)

    await screen.findByText('Give me the book please.')
    await user.click(screen.getByRole('button', { name: 'No me la recuerdes más' }))
    await user.click(screen.getByRole('button', { name: 'Sí, dominada' }))

    await waitFor(() => expect(dbMocks.masterEssentialWord).toHaveBeenCalledWith('the', 'user-1'))
    await screen.findByRole('heading', { name: 'be' })
  })

  it('renders ClozeCard for a middle-tier review whose rotation picks cloze', async () => {
    // selectMode es determinista (hash de palabra + repetitions). Buscamos el
    // reps del tier medio que produce cloze para "the" en vez de hardcodearlo,
    // así el test no depende de la función de hash.
    const { selectMode } = await import('@/lib/essential-words/exercise-modes')
    const theEntry = WORDS[0]
    const reps = [3, 4, 5].find(
      (r) => selectMode({ kind: 'review', entry: theEntry, repetitions: r }) === 'cloze_sentence',
    )
    expect(reps).toBeDefined()

    dbMocks.getEssentialWordsSrsEntries.mockResolvedValue([
      {
        wordId: 'c1k:the',
        word: 'the',
        interval: 6,
        ease: 2.5,
        repetitions: reps!,
        nextReview: '2026-07-01T00:00:00.000Z',
      },
    ])
    // Sin cuota de nuevas, para que la primera card sea el review de "the".
    dbMocks.getEssentialWordsIntroducedToday.mockResolvedValue(
      Array.from({ length: 10 }, (_, i) => `w${i}`),
    )

    render(<EssentialWordsSession />)

    expect(await screen.findByText('Completa la oración')).toBeTruthy()
    expect(screen.getByText('Give me ___ book please.')).toBeTruthy()
  })

  it('threads repetitions into ClozeCard so the rotated sentence variant is blanked', async () => {
    const { selectMode } = await import('@/lib/essential-words/exercise-modes')
    const { selectSentence } = await import('@/lib/essential-words/sentence-variants')
    const { clozeFor } = await import('@/lib/essential-words/cloze')

    const theEntry: EssentialWord = {
      ...WORDS[0],
      example_sentences: [
        { sentence: 'Please give the dog the bone today.', sentence_ipa: '' },
        { sentence: 'She put the cup on the table gently.', sentence_ipa: '' },
      ],
    }

    // Sanity check: at repetitions=0 (the value ClozeCard falls back to when
    // nothing is threaded through), selectSentence must resolve to the base
    // sentence — otherwise this fixture wouldn't distinguish "wired" from
    // "not wired".
    expect(selectSentence(theEntry, 0).sentence).toBe(theEntry.example_sentence)

    // Find a repetitions value that (a) routes to cloze_sentence and
    // (b) rotates selectSentence to an extra variant, not the base sentence.
    const reps = Array.from({ length: 20 }, (_, i) => i).find((r) => {
      const mode = selectMode({ kind: 'review', entry: theEntry, repetitions: r })
      const variant = selectSentence(theEntry, r)
      return mode === 'cloze_sentence' && variant.sentence !== theEntry.example_sentence
    })
    expect(reps).toBeDefined()

    const expectedSentence = selectSentence(theEntry, reps!).sentence
    const expectedCloze = clozeFor(theEntry, expectedSentence)
    expect(expectedCloze).not.toBeNull()

    coreWordClientMocks.fetchEssentialWords.mockResolvedValue([theEntry, WORDS[1]])
    dbMocks.getEssentialWordsSrsEntries.mockResolvedValue([
      {
        wordId: 'c1k:the',
        word: 'the',
        interval: 6,
        ease: 2.5,
        repetitions: reps!,
        nextReview: '2026-07-01T00:00:00.000Z',
      },
    ])
    dbMocks.getEssentialWordsIntroducedToday.mockResolvedValue(
      Array.from({ length: 10 }, (_, i) => `w${i}`),
    )

    render(<EssentialWordsSession />)

    expect(await screen.findByText(expectedCloze!.blanked)).toBeTruthy()
  })
})
