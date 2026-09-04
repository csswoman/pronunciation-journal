// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReaderPassage } from '@/lib/practice/reader/types'

const {
  user,
  getMyWords,
  pickTargets,
  resolveReaderPassage,
  completeReader,
  fetchEssentialWordsForDay,
} = vi.hoisted(() => ({
  user: { id: 'u1' },
  getMyWords: vi.fn(),
  pickTargets: vi.fn(),
  resolveReaderPassage: vi.fn(),
  completeReader: vi.fn(),
  fetchEssentialWordsForDay: vi.fn(),
}))

vi.mock('@/components/auth/AuthProvider', () => ({
  useAuth: () => ({ user }),
}))
vi.mock('@/hooks/useLoadingWords', () => ({
  useLoadingWords: () => [{ text: 'ready', ipa: '/ˈrɛdi/' }],
}))
vi.mock('@/lib/word-bank/queries', () => ({
  getMyWords,
  getReadyWordSummaries: vi.fn(async () => []),
}))
vi.mock('@/lib/practice/reader/select-targets', () => ({ pickTargets }))
vi.mock('@/lib/essential-words/client-fetch', () => ({ fetchEssentialWordsForDay }))
vi.mock('@/lib/practice/reader/get-passage', () => ({ resolveReaderPassage }))
vi.mock('@/lib/practice/reader/complete-reader', () => ({ completeReader }))
vi.mock('@/lib/db', () => ({
  getCachedReaderPassage: vi.fn(),
  saveReaderPassage: vi.fn(),
}))
vi.mock('@/lib/practice/reader/queries', () => ({
  generateReaderPassage: vi.fn(),
  resolveReaderLevel: vi.fn(async (_uid, defaultLvl = 'B1') => defaultLvl),
}))
vi.mock('../ReaderExercise', () => ({
  ReaderExercise: ({ passage, onComplete }: { passage: ReaderPassage; onComplete: (correct: boolean) => Promise<void> }) => (
    <div>
      <p>Exercise: {passage.id}</p>
      <button type="button" onClick={() => void onComplete(true)}>Complete</button>
    </div>
  ),
}))

import { ReaderEntry } from '../ReaderEntry'

const passage: ReaderPassage = {
  id: 'p1', userId: 'u1', targetItems: ['go'], targetSrsIds: ['wb:1'], targetHash: 'h', topic: 'travel',
  passage: 'Go home.', questions: [], level: 'B1', createdAt: '2030-01-01T00:00:00.000Z',
}

describe('ReaderEntry', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getMyWords.mockResolvedValue([{ id: '1', text: 'go', srs_status: 'new', next_review_at: null }])
    fetchEssentialWordsForDay.mockResolvedValue([])
  })

  it('shows the existing empty state when targets and fallback are ineligible', async () => {
    pickTargets.mockReturnValue(null)
    fetchEssentialWordsForDay.mockResolvedValue([])
    render(<ReaderEntry />)

    await waitFor(() => expect(screen.getByText(/desbloquear lecturas/i)).toBeInTheDocument())
    expect(resolveReaderPassage).not.toHaveBeenCalled()
  })

  it('falls back to essential words when user has fewer than 3 SRS targets', async () => {
    pickTargets.mockReturnValue(null)
    fetchEssentialWordsForDay.mockResolvedValue([
      { id: 'core1k:water', text: 'water' },
      { id: 'core1k:place', text: 'place' },
      { id: 'core1k:friend', text: 'friend' },
    ])
    resolveReaderPassage.mockResolvedValue(passage)
    render(<ReaderEntry />)

    await waitFor(() => expect(screen.getByText('Exercise: p1')).toBeInTheDocument())
    expect(resolveReaderPassage).toHaveBeenCalledWith(
      expect.objectContaining({
        targets: [
          { srsId: 'core1k:water', word: 'water' },
          { srsId: 'core1k:place', word: 'place' },
          { srsId: 'core1k:friend', word: 'friend' },
        ],
        level: 'A1',
      }),
    )
  })

  it('resolves eligible targets and persists completion through the shared function', async () => {
    pickTargets.mockReturnValue([{ srsId: 'wb:1', word: 'go' }])
    resolveReaderPassage.mockResolvedValue(passage)
    render(<ReaderEntry />)

    await waitFor(() => expect(screen.getByText('Exercise: p1')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Complete' }))
    await waitFor(() => expect(completeReader).toHaveBeenCalledWith({
      userId: 'u1', passageId: 'p1', correct: true, context: 'practice',
    }))
  })

  it('shows the existing retry action when loading fails', async () => {
    pickTargets.mockReturnValue([{ srsId: 'wb:1', word: 'go' }])
    resolveReaderPassage.mockRejectedValue(new Error('network'))
    render(<ReaderEntry />)

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  })
})
