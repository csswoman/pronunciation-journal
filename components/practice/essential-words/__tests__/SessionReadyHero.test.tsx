// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SessionReadyHero } from '../SessionReadyHero'

const baseStats = {
  totalWords: 740, learned: 10, dueCount: 0, dueTomorrow: 0,
  newToday: 0, newQuota: 10, vaulted: 0,
}

const heroProps = {
  counts: { newRemaining: 8, learningRemaining: 0, reviewRemaining: 16 },
  stats: baseStats,
  isResume: false,
  activeRouteId: null as string | null,
  onRouteChange: vi.fn(),
  sessionSize: 'recommended' as const,
  onSessionSizeChange: vi.fn(),
  onBegin: vi.fn(),
}

describe('SessionReadyHero', () => {
  it('shows the commitment headline, breakdown, size picker, route chips, and start CTA', () => {
    render(<SessionReadyHero {...heroProps} />)

    expect(screen.getByRole('heading', { name: 'Hoy te tocan 24 palabras' })).toBeInTheDocument()
    expect(screen.getByText(/unos \d+ min/)).toBeInTheDocument()
    expect(screen.getByText('8 nuevas · 16 repasos · 1 ronda final')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Recomendada · 9' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Sesión recomendada' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Empezar' })).toBeInTheDocument()
  })

  it('uses review-only copy with final round when there are no new words', () => {
    render(
      <SessionReadyHero
        {...heroProps}
        counts={{ newRemaining: 0, learningRemaining: 0, reviewRemaining: 5 }}
      />,
    )
    expect(screen.getByText('5 repasos · 1 ronda final')).toBeInTheDocument()
  })

  it('switches to resume copy when learning cards remain', () => {
    render(
      <SessionReadyHero
        {...heroProps}
        counts={{ newRemaining: 2, learningRemaining: 3, reviewRemaining: 4 }}
        isResume
      />,
    )
    expect(
      screen.getByRole('heading', { name: 'Continuar donde lo dejaste' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Retoma la sesión que dejaste a medias')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeInTheDocument()
  })

  it('calls onBegin when Empezar is pressed', async () => {
    const user = userEvent.setup()
    const onBegin = vi.fn()
    render(<SessionReadyHero {...heroProps} onBegin={onBegin} />)
    await user.click(screen.getByRole('button', { name: 'Empezar' }))
    expect(onBegin).toHaveBeenCalledOnce()
  })

  it('calls onSessionSizeChange when a size chip is pressed', async () => {
    const user = userEvent.setup()
    const onSessionSizeChange = vi.fn()
    render(<SessionReadyHero {...heroProps} onSessionSizeChange={onSessionSizeChange} />)
    await user.click(screen.getByRole('button', { name: 'Larga · 15' }))
    expect(onSessionSizeChange).toHaveBeenCalledWith('long')
  })
})
