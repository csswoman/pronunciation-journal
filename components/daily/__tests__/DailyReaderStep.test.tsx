// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReaderPassage } from '@/lib/practice/reader/types'

const { completeReader } = vi.hoisted(() => ({
  completeReader: vi.fn(),
}))

vi.mock('@/components/auth/AuthProvider', () => ({
  useAuth: () => ({ user: { id: 'u1' } }),
}))

vi.mock('@/lib/practice/reader/complete-reader', () => ({
  completeReader,
}))

vi.mock('@/components/practice/reader/ReaderExercise', () => ({
  ReaderExercise: ({
    passage,
    onComplete,
  }: {
    passage: ReaderPassage
    onComplete: (correct: boolean) => Promise<void>
  }) => (
    <div>
      <span>{passage.passage}</span>
      <button type="button" onClick={() => void onComplete(true)}>
        Finish reader
      </button>
    </div>
  ),
}))

import { DailyReaderStep } from '../DailyReaderStep'

const passage: ReaderPassage = {
  id: 'reader-1',
  userId: 'u1',
  targetItems: ['resilient'],
  targetSrsIds: ['wb:word-1'],
  targetHash: 'hash',
  topic: 'daily',
  passage: 'A resilient learner keeps practicing.',
  questions: [],
  level: 'B1',
  createdAt: '2026-07-17T00:00:00.000Z',
}

describe('DailyReaderStep', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    completeReader.mockResolvedValue(undefined)
  })

  it('renders prior-step hints and completes in daily context', async () => {
    const onComplete = vi.fn()
    render(
      <DailyReaderStep
        passage={passage}
        threadHints={[
          {
            word: 'resilient',
            ipa: '/rɪˈzɪliənt/',
            fromStepTitle: 'Introducción',
            fromStepKind: 'word_intro',
          },
        ]}
        onComplete={onComplete}
      />,
    )

    expect(screen.getByText('A resilient learner keeps practicing.')).toBeInTheDocument()
    expect(screen.getByText('Reaparecen hoy')).toBeInTheDocument()
    expect(screen.queryByText(/de Introducción/i)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Finish reader' }))

    await waitFor(() =>
      expect(completeReader).toHaveBeenCalledWith({
        userId: 'u1',
        passageId: 'reader-1',
        correct: true,
        context: 'daily',
      }),
    )
    expect(onComplete).toHaveBeenCalledOnce()
  })
})
