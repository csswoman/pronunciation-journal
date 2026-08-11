// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SessionReady } from '../SessionReady'

const baseStats = {
  totalWords: 200,
  learned: 12,
  dueCount: 12,
  dueTomorrow: 0,
  newToday: 0,
  newQuota: 10,
  vaulted: 2,
}

vi.mock('@/hooks/useEssentialWordsReadyDashboard', () => ({
  useEssentialWordsReadyDashboard: () => ({
    forecast: Array.from({ length: 7 }, (_, i) => ({
      dayKey: `2026-08-${10 + i}`,
      label: 'L',
      count: i,
    })),
    vocabulary: { nuevas: 2, aprendiendo: 3, en_repaso: 4, dominadas: 1 },
    retention: { pct: 87, sampleSize: 20 },
    leeches: [{ wordId: 'c1k:hard', word: 'hard', lapses: 4 }],
    streakMarks: [false, false, true, true, false, false, true],
    heatmap: Array.from({ length: 84 }, (_, i) => ({
      dayKey: `d${i}`,
      count: i % 3,
      level: (i % 5) as 0 | 1 | 2 | 3 | 4,
    })),
    lastSession: { practiced: 9, correct: 8, durationMs: 342000, completedAt: '2026-08-09T12:00:00.000Z' },
  }),
}))

vi.mock('../SessionReadyVaultRow', () => ({
  SessionReadyVaultRow: () => <div data-testid="vault" />,
}))

vi.mock('../SessionReadyHero', () => ({
  SessionReadyHero: ({
    preview,
    isResume,
    onBegin,
  }: {
    preview: { scheduledActions: number }
    isResume: boolean
    onBegin: () => void
  }) => {
    return (
      <div>
        <h2 id="session-ready-title">
          {isResume ? 'Continuar donde lo dejaste' : `Hoy tienes ${preview.scheduledActions} ejercicios`}
        </h2>
        <button type="button" onClick={onBegin}>
          {isResume ? 'Continuar' : 'Empezar'}
        </button>
      </div>
    )
  },
}))

const readyProps = {
  preview: {
    actionBudget: 15, scheduledActions: 15, uniqueWords: 5, newWordCount: 3,
    reviewActionCount: 4, continuationActionCount: 0, estimatedDurationMs: 168_000,
    completedActions: 0, remainingActions: 15,
  },
  stats: baseStats,
  streak: 3,
  activeRouteId: null as string | null,
  onRouteChange: vi.fn(),
  sessionSize: 'recommended' as const,
  onSessionSizeChange: vi.fn(),
  onBegin: vi.fn(),
  onLeechReview: vi.fn(),
  isResume: false,
  previewLoading: false,
  onDiscard: vi.fn(),
}

describe('SessionReady', () => {
  it('composes hero, recap, forecast, vocabulary, rail, and heatmap', () => {
    render(<SessionReady {...readyProps} />)

    expect(screen.getByRole('heading', { name: 'Hoy tienes 15 ejercicios' })).toBeInTheDocument()
    expect(screen.getByText(/Última: buen ritmo · 8\/9/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Próximos 7 días' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Tu vocabulario' })).toBeInTheDocument()
    expect(screen.getByText('Racha')).toBeInTheDocument()
    expect(screen.getByText('Retención 30 días')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Se te resisten' })).toBeInTheDocument()
    expect(screen.getByTestId('vault')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Últimas 12 semanas' })).toBeInTheDocument()
  })

  it('calls onBegin from the hero CTA', async () => {
    const user = userEvent.setup()
    const onBegin = vi.fn()
    render(<SessionReady {...readyProps} onBegin={onBegin} />)
    await user.click(screen.getByRole('button', { name: 'Empezar' }))
    expect(onBegin).toHaveBeenCalledOnce()
  })

  it('disables the alternate leech route while resuming a draft', () => {
    render(<SessionReady {...readyProps} isResume />)
    expect(screen.getByRole('button', { name: 'Repasar las 1 difíciles →' })).toBeDisabled()
  })
})
