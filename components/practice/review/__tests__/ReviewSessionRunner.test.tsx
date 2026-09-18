// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { ReviewSessionRunner } from '../ReviewSessionRunner'
import type { ReviewSessionPhase } from '@/hooks/useReviewSession'
import type { ReviewHubSummary } from '@/lib/review/types'

const summary = {
  failedSentences: [], weakWords: [], dueWords: [], soundsDue: [], dueTopics: [], weakTopics: [],
  dueLessons: [], essentialWordsDue: [], canStartReview: false, nothingDue: true,
  counts: { failedSentences: 0, weakWords: 0, dueWords: 0, soundsDue: 0, dueTopics: 0,
    weakTopics: 0, dueLessons: 0, essentialWordsDue: 0, reviewable: 0, total: 0 },
} as ReviewHubSummary

const mockStartReview = vi.fn()
const mockStartFailedItem = vi.fn()
const mockStartTopic = vi.fn()
const mockAdvanceStep = vi.fn()
const mockExitSession = vi.fn()

let mockCurrentState: ReviewSessionPhase = { phase: 'idle' }

vi.mock('@/hooks/useReviewSession', () => ({
  useReviewSession: () => ({
    state: mockCurrentState,
    sessionKey: 1,
    startReview: mockStartReview,
    startFailedItem: mockStartFailedItem,
    startTopic: mockStartTopic,
    advanceStep: mockAdvanceStep,
    exitSession: mockExitSession,
  }),
}))

vi.mock('../ReviewSessionLauncher', () => ({
  ReviewSessionLauncher: ({ onExit }: { onExit: () => void }) => (
    <div data-testid="session-launcher">
      <span>Launcher View</span>
      <button type="button" onClick={onExit}>
        Launcher Exit
      </button>
    </div>
  ),
}))

describe('ReviewSessionRunner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCurrentState = { phase: 'idle' }
  })

  it('calls startReview only once when mounted inside React.StrictMode', () => {
    const onExit = vi.fn()

    render(
      <React.StrictMode>
        <ReviewSessionRunner action={{ type: 'review' }} summary={summary} onExit={onExit} />
      </React.StrictMode>,
    )

    // Strict Mode double-invokes effects on mount in development.
    // The ref guard ensures startReview is called only once.
    expect(mockStartReview).toHaveBeenCalledTimes(1)
  })

  it('does not re-invoke startReview when re-rendered with equivalent action object', () => {
    const onExit = vi.fn()

    const { rerender } = render(
      <ReviewSessionRunner action={{ type: 'review' }} summary={summary} onExit={onExit} />,
    )

    expect(mockStartReview).toHaveBeenCalledTimes(1)

    // Rerender with a fresh object reference having the same shape
    rerender(<ReviewSessionRunner action={{ type: 'review' }} summary={summary} onExit={onExit} />)

    expect(mockStartReview).toHaveBeenCalledTimes(1)
  })

  it('triggers new action when action type or parameters change', () => {
    const onExit = vi.fn()

    const { rerender } = render(
      <ReviewSessionRunner action={{ type: 'review' }} summary={summary} onExit={onExit} />,
    )

    expect(mockStartReview).toHaveBeenCalledTimes(1)
    expect(mockStartTopic).not.toHaveBeenCalled()

    // Change action to topic
    rerender(
      <ReviewSessionRunner
        action={{ type: 'topic', topic: 'grammar:past-tense' }}
        summary={summary}
        onExit={onExit}
      />,
    )

    expect(mockStartTopic).toHaveBeenCalledTimes(1)
    expect(mockStartTopic).toHaveBeenCalledWith('grammar:past-tense')
  })

  it('renders loading state correctly', () => {
    mockCurrentState = { phase: 'loading' }

    render(
      <ReviewSessionRunner action={{ type: 'review' }} summary={summary} onExit={vi.fn()} />,
    )

    expect(screen.getByText('Cargando sesión…')).toBeTruthy()
  })

  it('renders error overlay and calls exitSession and onExit when clicking exit', () => {
    mockCurrentState = { phase: 'error' }
    const onExit = vi.fn()

    render(
      <ReviewSessionRunner action={{ type: 'review' }} summary={summary} onExit={onExit} />,
    )

    expect(screen.getByText('No se pudo cargar la sesión de repaso.')).toBeTruthy()

    const exitBtn = screen.getByRole('button', { name: 'Volver al hub' })
    fireEvent.click(exitBtn)

    expect(mockExitSession).toHaveBeenCalledTimes(1)
    expect(onExit).toHaveBeenCalledTimes(1)
  })

  it('renders done overlay and exits properly', () => {
    mockCurrentState = { phase: 'done' }
    const onExit = vi.fn()

    render(
      <ReviewSessionRunner action={{ type: 'review' }} summary={summary} onExit={onExit} />,
    )

    expect(screen.getByText('¡Repaso completado!')).toBeTruthy()

    const exitBtn = screen.getByRole('button', { name: 'Volver al hub' })
    fireEvent.click(exitBtn)

    expect(mockExitSession).toHaveBeenCalledTimes(1)
    expect(onExit).toHaveBeenCalledTimes(1)
  })

  it('renders ReviewSessionLauncher when phase is session', () => {
    mockCurrentState = {
      phase: 'session',
      steps: [],
      stepIndex: 0,
    }

    render(
      <ReviewSessionRunner action={{ type: 'review' }} summary={summary} onExit={vi.fn()} />,
    )

    expect(screen.getByTestId('session-launcher')).toBeTruthy()
  })
})
