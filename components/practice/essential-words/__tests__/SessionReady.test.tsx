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

vi.mock('../SessionReadyLevelProgress', () => ({
  SessionReadyLevelProgress: () => <div data-testid="level-progress" />,
}))

vi.mock('../SessionReadyInsights', () => ({
  SessionReadyInsights: () => <div data-testid="insights" />,
}))

vi.mock('../SessionReadyVaultRow', () => ({
  SessionReadyVaultRow: () => null,
}))

vi.mock('../SessionReadyHero', () => ({
  SessionReadyHero: ({
    counts,
    isResume,
    onBegin,
  }: {
    counts: { newRemaining: number; learningRemaining: number; reviewRemaining: number }
    isResume: boolean
    onBegin: () => void
  }) => {
    const total = counts.newRemaining + counts.learningRemaining + counts.reviewRemaining
    return (
      <div>
        <h2 id="session-ready-title">
          {isResume ? 'Continuar donde lo dejaste' : `Hoy te tocan ${total} palabras`}
        </h2>
        <button type="button" onClick={onBegin}>
          {isResume ? 'Continuar' : 'Empezar'}
        </button>
      </div>
    )
  },
}))

describe('SessionReady', () => {
  it('composes the ready screen sections', () => {
    render(
      <SessionReady
        counts={{ newRemaining: 8, learningRemaining: 0, reviewRemaining: 16 }}
        stats={baseStats}
        activeRouteId={null}
        onRouteChange={vi.fn()}
        onBegin={vi.fn()}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Hoy te tocan 24 palabras' })).toBeInTheDocument()
    expect(screen.getByTestId('level-progress')).toBeInTheDocument()
    expect(screen.getByTestId('insights')).toBeInTheDocument()
  })

  it('forwards resume state to the hero', () => {
    render(
      <SessionReady
        counts={{ newRemaining: 2, learningRemaining: 3, reviewRemaining: 4 }}
        stats={baseStats}
        activeRouteId={null}
        onRouteChange={vi.fn()}
        onBegin={vi.fn()}
      />,
    )

    expect(
      screen.getByRole('heading', { name: 'Continuar donde lo dejaste' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeInTheDocument()
  })

  it('calls onBegin from the hero CTA', async () => {
    const user = userEvent.setup()
    const onBegin = vi.fn()
    render(
      <SessionReady
        counts={{ newRemaining: 3, learningRemaining: 0, reviewRemaining: 0 }}
        stats={baseStats}
        activeRouteId={null}
        onRouteChange={vi.fn()}
        onBegin={onBegin}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Empezar' }))

    expect(onBegin).toHaveBeenCalledOnce()
  })
})
