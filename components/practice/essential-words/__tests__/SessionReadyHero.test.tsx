// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SessionReadyHero } from '../SessionReadyHero'

vi.mock('@/components/auth/AuthProvider', () => ({
  useAuth: () => ({ user: null }),
}))

vi.mock('@/lib/essential-words/client', () => ({
  fetchEssentialWords: vi.fn(async () => []),
}))

vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: () => [],
}))

const baseStats = {
  totalWords: 740, learned: 10, dueCount: 0, dueTomorrow: 0,
  newToday: 0, newQuota: 10, vaulted: 0,
}

describe('SessionReadyHero', () => {
  it('shows the commitment headline, inline stats, and start CTA', () => {
    render(
      <SessionReadyHero
        counts={{ newRemaining: 8, learningRemaining: 0, reviewRemaining: 16 }}
        stats={baseStats}
        isResume={false}
        activeRouteId={null}
        onRouteChange={vi.fn()}
        onBegin={vi.fn()}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Hoy te tocan 24 palabras' })).toBeInTheDocument()
    expect(screen.getByText(/unos \d+ min/)).toBeInTheDocument()
    expect(screen.getByText('8', { selector: '.font-semibold' })).toBeInTheDocument()
    expect(screen.getByText('16', { selector: '.font-semibold' })).toBeInTheDocument()
    expect(screen.getByText('nuevas', { exact: true })).toBeInTheDocument()
    expect(screen.getByText('repasos', { exact: true })).toBeInTheDocument()
    expect(screen.queryByText('Aprendiendo')).toBeNull()
    expect(screen.getByText('Sesión recomendada')).toBeInTheDocument()
  })

  it('describes the block structure when there are new words', () => {
    render(
      <SessionReadyHero
        counts={{ newRemaining: 8, learningRemaining: 0, reviewRemaining: 16 }}
        stats={baseStats}
        isResume={false}
        activeRouteId={null}
        onRouteChange={vi.fn()}
        onBegin={vi.fn()}
      />,
    )

    expect(
      screen.getByText('3 bloques de palabras nuevas, más los repasos y una ronda final'),
    ).toBeTruthy()
  })

  it('uses review-only copy when there are no new words', () => {
    render(
      <SessionReadyHero
        counts={{ newRemaining: 0, learningRemaining: 0, reviewRemaining: 5 }}
        stats={baseStats}
        isResume={false}
        activeRouteId={null}
        onRouteChange={vi.fn()}
        onBegin={vi.fn()}
      />,
    )

    expect(screen.getByText('Solo repaso de palabras que ya has visto')).toBeInTheDocument()
    expect(screen.queryByText(/bloques de palabras nuevas/)).toBeNull()
  })

  it('switches to resume copy when learning cards remain', () => {
    render(
      <SessionReadyHero
        counts={{ newRemaining: 2, learningRemaining: 3, reviewRemaining: 4 }}
        stats={baseStats}
        isResume
        activeRouteId={null}
        onRouteChange={vi.fn()}
        onBegin={vi.fn()}
      />,
    )

    expect(
      screen.getByRole('heading', { name: 'Continuar donde lo dejaste' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Retoma la sesión que dejaste a medias')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeInTheDocument()
    expect(screen.queryByText('Aprendiendo')).toBeNull()
  })

  it('calls onBegin when Empezar is pressed', async () => {
    const user = userEvent.setup()
    const onBegin = vi.fn()
    render(
      <SessionReadyHero
        counts={{ newRemaining: 3, learningRemaining: 0, reviewRemaining: 0 }}
        stats={baseStats}
        isResume={false}
        activeRouteId={null}
        onRouteChange={vi.fn()}
        onBegin={onBegin}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Empezar' }))

    expect(onBegin).toHaveBeenCalledOnce()
  })

  it('shows the daily-quota-met banner when today\'s quota is filled and nothing is due', () => {
    render(
      <SessionReadyHero
        counts={{ newRemaining: 0, learningRemaining: 0, reviewRemaining: 5 }}
        stats={{ ...baseStats, dueCount: 0, newToday: 10, newQuota: 10 }}
        isResume={false}
        activeRouteId={null}
        onRouteChange={vi.fn()}
        onBegin={vi.fn()}
      />,
    )

    expect(screen.getByText(/ya completaste tu diaria de hoy/i)).toBeInTheDocument()
  })

  it('does not show the banner while reviews are still due today', () => {
    render(
      <SessionReadyHero
        counts={{ newRemaining: 0, learningRemaining: 0, reviewRemaining: 5 }}
        stats={{ ...baseStats, dueCount: 3, newToday: 10, newQuota: 10 }}
        isResume={false}
        activeRouteId={null}
        onRouteChange={vi.fn()}
        onBegin={vi.fn()}
      />,
    )

    expect(screen.queryByText(/ya completaste tu diaria de hoy/i)).not.toBeInTheDocument()
  })
})
