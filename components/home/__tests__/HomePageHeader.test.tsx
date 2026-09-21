// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import HomePageHeader from '@/components/home/HomePageHeader'

vi.mock('@/components/auth/AuthProvider', () => ({
  useAuth: () => ({ user: null }),
}))

vi.mock('@/hooks/useUserPreferences', () => ({
  useUserPreferences: () => ({ preferences: null }),
}))

vi.mock('@/components/layout/PageHeader', () => ({
  default: ({
    title,
    subtitle,
    actions,
  }: {
    title: string
    subtitle?: string
    actions?: React.ReactNode
  }) => (
    <header>
      <h1>{title}</h1>
      {subtitle ? <p>{subtitle}</p> : null}
      {actions}
    </header>
  ),
}))

describe('HomePageHeader streak copy', () => {
  it('shows the streak as a chip alongside the weekly minutes subtitle', () => {
    render(
      <HomePageHeader
        streak={{ currentStreak: 4, maxStreak: 4, completedToday: true }}
        weekMinutes={20}
        isNewLearner={false}
      />,
    )
    expect(screen.getByText(/4 días/i)).toBeInTheDocument()
    expect(screen.getByText(/20 min esta semana/i)).toBeInTheDocument()
  })

  it('shows no streak chip when streak is 0 but still shows weekly minutes', () => {
    render(
      <HomePageHeader
        streak={{ currentStreak: 0, maxStreak: 0, completedToday: false }}
        weekMinutes={12}
        isNewLearner={false}
      />,
    )
    expect(screen.queryByText(/^0 días$/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/^1 día$/i)).not.toBeInTheDocument()
    expect(screen.getByText(/12 min esta semana/i)).toBeInTheDocument()
  })

  it('keeps first-visit orientation when there is no retention signal', () => {
    render(
      <HomePageHeader
        streak={{ currentStreak: 0, maxStreak: 0, completedToday: false }}
        weekMinutes={0}
        isNewLearner
      />,
    )
    expect(screen.getByText(/camino más corto/i)).toBeInTheDocument()
  })
})
