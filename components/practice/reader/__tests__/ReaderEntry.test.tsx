// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReaderPassage } from '@/lib/practice/reader/types'

const {
  user,
  getMyWords,
  pickTargets,
  completeReader,
  fetchEssentialWordsForDay,
  getUserReaderPassages,
  deleteUserReaderPassage,
  generateReaderPassage,
  resolveReaderLevel,
  saveReaderPassage,
} = vi.hoisted(() => ({
  user: { id: 'u1' },
  getMyWords: vi.fn(),
  pickTargets: vi.fn(),
  completeReader: vi.fn(),
  fetchEssentialWordsForDay: vi.fn(),
  getUserReaderPassages: vi.fn(),
  deleteUserReaderPassage: vi.fn(),
  generateReaderPassage: vi.fn(),
  resolveReaderLevel: vi.fn(),
  saveReaderPassage: vi.fn(),
}))

vi.mock('@/components/auth/AuthProvider', () => ({
  useAuth: () => ({ user }),
}))
vi.mock('@/hooks/useLoadingWords', () => ({
  useLoadingWords: () => [{ text: 'ready', ipa: '/ˈrɛdi/' }],
}))
vi.mock('@/lib/word-bank/queries', () => ({
  getMyWords,
}))
vi.mock('@/lib/practice/reader/select-targets', () => ({ pickTargets }))
vi.mock('@/lib/essential-words/client-fetch', () => ({ fetchEssentialWordsForDay }))
vi.mock('@/lib/practice/reader/complete-reader', () => ({ completeReader }))
vi.mock('@/lib/db', () => ({
  saveReaderPassage,
}))
vi.mock('@/lib/practice/reader/queries', () => ({
  generateReaderPassage,
  resolveReaderLevel,
  getUserReaderPassages,
  deleteUserReaderPassage,
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

const samplePassage: ReaderPassage = {
  id: 'p1',
  userId: 'u1',
  targetItems: ['coffee', 'ordered'],
  targetSrsIds: ['wb:1', 'wb:2'],
  targetHash: 'hash-p1',
  topic: 'Coffee Adventure',
  passage: 'I ordered coffee at a small shop.',
  questions: [],
  level: 'B1',
  createdAt: '2026-09-01T10:00:00.000Z',
}

describe('ReaderEntry', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getMyWords.mockResolvedValue([{ id: '1', text: 'coffee', srs_status: 'learning', next_review_at: '2026-09-10' }])
    pickTargets.mockReturnValue([{ srsId: 'wb:1', word: 'coffee' }, { srsId: 'wb:2', word: 'ordered' }])
    getUserReaderPassages.mockResolvedValue([samplePassage])
    resolveReaderLevel.mockResolvedValue('B1')
    fetchEssentialWordsForDay.mockResolvedValue([])
  })

  it('renders catalog with saved passages and handles passage selection', async () => {
    render(<ReaderEntry />)

    await waitFor(() => {
      expect(screen.getByText('Coffee Adventure')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Coffee Adventure'))

    await waitFor(() => {
      expect(screen.getByText('Exercise: p1')).toBeInTheDocument()
    })

    // Navigation back to catalog
    fireEvent.click(screen.getByText(/Volver a la biblioteca/i))

    await waitFor(() => {
      expect(screen.getByText('Coffee Adventure')).toBeInTheDocument()
    })
  })

  it('opens create story modal and generates a new story with custom topic and level', async () => {
    const userEv = userEvent.setup()
    const newPassage: ReaderPassage = {
      id: 'p2',
      userId: 'u1',
      targetItems: ['coffee'],
      targetSrsIds: ['wb:1'],
      targetHash: 'hash-p2',
      topic: 'Viaje a Tokio',
      passage: 'En Tokio tomé café delicioso.',
      questions: [],
      level: 'A2',
      createdAt: '2026-09-07T10:00:00.000Z',
    }
    generateReaderPassage.mockResolvedValue(newPassage)

    render(<ReaderEntry />)

    await waitFor(() => {
      expect(screen.getByText('Coffee Adventure')).toBeInTheDocument()
    })

    // Open modal
    await userEv.click(screen.getByRole('button', { name: /Nueva historia ✨/i }))

    const modal = screen.getByRole('dialog')
    expect(modal).toBeInTheDocument()

    // Change level to A2 inside modal
    const a2Button = within(modal).getByRole('button', { name: /A2/i })
    await userEv.click(a2Button)

    // Type custom topic inside modal
    const topicInput = within(modal).getByLabelText(/¿De qué tema quieres la historia\?/i)
    await userEv.type(topicInput, 'Viaje a Tokio')

    // Click submit inside modal
    await userEv.click(within(modal).getByRole('button', { name: /Crear historia/i }))

    await waitFor(() => {
      expect(generateReaderPassage).toHaveBeenCalledWith(
        'u1',
        expect.any(Array),
        'A2',
        'Viaje a Tokio',
      )
    })

    expect(saveReaderPassage).toHaveBeenCalledWith(newPassage)
    await waitFor(() => {
      expect(screen.getByText('Exercise: p2')).toBeInTheDocument()
    })
  })

  it('handles passage deletion from catalog', async () => {
    const userEv = userEvent.setup()
    render(<ReaderEntry />)

    await waitFor(() => {
      expect(screen.getByText('Coffee Adventure')).toBeInTheDocument()
    })

    const deleteBtn = screen.getByRole('button', { name: /Eliminar lectura/i })
    await userEv.click(deleteBtn)

    expect(deleteUserReaderPassage).toHaveBeenCalledWith('p1')
    await waitFor(() => {
      expect(screen.queryByText('Coffee Adventure')).not.toBeInTheDocument()
    })
  })
})
