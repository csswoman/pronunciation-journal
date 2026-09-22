// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ReviewHubClient } from '../ReviewHubClient'
import type { ReviewHubSummary } from '@/lib/review/types'

// Mock dynamic ReviewSessionRunner to inspect its mounting and props
const mockRunner = vi.fn()
vi.mock('../ReviewSessionRunner', () => ({
  ReviewSessionRunner: (props: unknown) => {
    mockRunner(props)
    return (
      <div data-testid="review-session-runner">
        <span>Active Session Mock</span>
        <button
          type="button"
          onClick={() => (props as { onExit: () => void }).onExit()}
        >
          Exit Session
        </button>
      </div>
    )
  },
}))

vi.mock('@/components/practice/srs-vault/SrsVault', () => ({
  SrsVault: () => <div data-testid="srs-vault" />,
}))

const mockSummary: ReviewHubSummary = {
  counts: {
    executable: 5,
    elsewhere: 0,
    failedSentences: 1,
    weakWords: 1,
    dueWords: 1,
    soundsDue: 1,
    dueTopics: 1,
    weakTopics: 1,
    dueLessons: 0,
    essentialWordsDue: 0,
    total: 5,
  },
  canStartReview: true,
  nothingDue: false,
  failedSentences: [
    {
      contentId: 'sent-1',
      label: 'I went to the store yesterday',
      typeLabel: 'Grammar Error',
      drillable: true,
      phrase: 'I went to the store yesterday',
      wordBankId: null,
      slug: 'sent-1',
      failedAt: '2026-09-14',
    },
  ],
  weakWords: [
    {
      id: 'word-1',
      text: 'thorough',
      translation: 'minucioso',
      lastReviewedAt: '2026-09-14',
    } as unknown as ReviewHubSummary['weakWords'][number],
  ],
  dueWords: [
    {
      id: 'word-2',
      text: 'schedule',
      ipa: 'ˈskedʒuːl',
    } as unknown as ReviewHubSummary['dueWords'][number],
  ],
  soundsDue: [
    {
      soundId: 'th-unvoiced',
      ipa: 'θ',
      example: 'think',
      daysOverdue: 1,
    } as unknown as ReviewHubSummary['soundsDue'][number],
  ],
  dueTopics: [
    {
      id: 'topic-past-simple',
      topic: 'Past Simple',
    } as unknown as ReviewHubSummary['dueTopics'][number],
  ],
  weakTopics: [
    {
      id: 'topic-present-perfect',
      topic: 'Present Perfect',
    } as unknown as ReviewHubSummary['weakTopics'][number],
  ],
  dueLessons: [],
  essentialWordsDue: [],
}

describe('ReviewHubClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders summary ready without active session mounted', () => {
    render(<ReviewHubClient summary={mockSummary} />)

    expect(screen.getByText('5')).toBeDefined()
    expect(screen.getByText('Oraciones fallidas')).toBeDefined()
    expect(screen.getByText('I went to the store yesterday')).toBeDefined()
    expect(screen.getByText('Palabras débiles')).toBeDefined()
    expect(screen.getByText('thorough')).toBeDefined()
    expect(screen.getByText('Vocabulario pendiente')).toBeDefined()
    expect(screen.getByText('schedule')).toBeDefined()
    expect(screen.getByText('Sonidos pendientes')).toBeDefined()
    expect(screen.getByText('Conceptos pendientes')).toBeDefined()
    expect(screen.getByText('Past Simple')).toBeDefined()

    // Active session runner must NOT be mounted on initial summary view
    expect(screen.queryByTestId('review-session-runner')).toBeNull()
  })

  it('starts full review queue upon user clicking start review', async () => {
    render(<ReviewHubClient summary={mockSummary} />)

    const startBtn = screen.getByRole('button', { name: /repaso completo/i })
    fireEvent.click(startBtn)

    await waitFor(() => {
      expect(screen.getByTestId('review-session-runner')).toBeDefined()
    })
    expect(mockRunner).toHaveBeenCalledWith(
      expect.objectContaining({
        action: { type: 'review' },
      }),
    )
  })

  it('starts individual failed sentence practice', async () => {
    render(<ReviewHubClient summary={mockSummary} />)

    const practiceBtns = screen.getAllByRole('button', { name: /practicar/i })
    fireEvent.click(practiceBtns[0])

    await waitFor(() => {
      expect(screen.getByTestId('review-session-runner')).toBeDefined()
    })
    expect(mockRunner).toHaveBeenCalledWith(
      expect.objectContaining({
        action: {
          type: 'failed_item',
          item: mockSummary.failedSentences[0],
        },
      }),
    )
  })

  it('supports early exit returning to hub summary', async () => {
    render(<ReviewHubClient summary={mockSummary} />)

    const startBtn = screen.getByRole('button', { name: /repaso completo/i })
    fireEvent.click(startBtn)

    await waitFor(() => {
      expect(screen.getByTestId('review-session-runner')).toBeDefined()
    })

    const exitBtn = screen.getByRole('button', { name: /exit session/i })
    fireEvent.click(exitBtn)

    await waitFor(() => {
      expect(screen.queryByTestId('review-session-runner')).toBeNull()
    })
    expect(screen.getByText('I went to the store yesterday')).toBeDefined()
  })
})
