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
} = vi.hoisted(() => ({
  user: { id: 'u1' },
  getMyWords: vi.fn(),
  pickTargets: vi.fn(),
  resolveReaderPassage: vi.fn(),
  completeReader: vi.fn(),
}))

vi.mock('@/components/auth/AuthProvider', () => ({
  useAuth: () => ({ user }),
}))
vi.mock('@/lib/word-bank/queries', () => ({ getMyWords }))
vi.mock('@/lib/practice/reader/select-targets', () => ({ pickTargets }))
vi.mock('@/lib/practice/reader/get-passage', () => ({ resolveReaderPassage }))
vi.mock('@/lib/practice/reader/complete-reader', () => ({ completeReader }))
vi.mock('@/lib/db', () => ({
  getCachedReaderPassage: vi.fn(),
  saveReaderPassage: vi.fn(),
}))
vi.mock('@/lib/practice/reader/queries', () => ({
  generateReaderPassage: vi.fn(),
  resolveReaderLevel: vi.fn(async () => 'B1'),
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
  })

  it('shows the existing empty state without resolving a passage when targets are ineligible', async () => {
    pickTargets.mockReturnValue(null)
    render(<ReaderEntry />)

    await waitFor(() => expect(screen.getByText(/desbloquear lecturas/i)).toBeInTheDocument())
    expect(resolveReaderPassage).not.toHaveBeenCalled()
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
