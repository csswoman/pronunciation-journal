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
  default: ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <header>
      <h1>{title}</h1>
      {subtitle ? <p>{subtitle}</p> : null}
    </header>
  ),
}))

describe('HomePageHeader streak copy', () => {
  it('puts a numbered streak in the subtitle', () => {
    render(
      <HomePageHeader
        streak={{ currentStreak: 4, maxStreak: 4, completedToday: true }}
        wordsMastered={2}
        isNewLearner={false}
      />,
    )
    expect(screen.getByText(/racha: 4 días/i)).toBeInTheDocument()
    expect(screen.getByText(/2 palabras dominadas/i)).toBeInTheDocument()
  })

  it('shows racha 0 with a concrete next action when there is progress', () => {
    render(
      <HomePageHeader
        streak={{ currentStreak: 0, maxStreak: 0, completedToday: false }}
        wordsMastered={12}
        isNewLearner={false}
      />,
    )
    expect(screen.getByText(/racha: 0/i)).toBeInTheDocument()
    expect(screen.getByText(/completa el plan/i)).toBeInTheDocument()
  })

  it('keeps first-visit orientation when there is no retention signal', () => {
    render(
      <HomePageHeader
        streak={{ currentStreak: 0, maxStreak: 0, completedToday: false }}
        wordsMastered={0}
        isNewLearner
      />,
    )
    expect(screen.getByText(/camino más corto/i)).toBeInTheDocument()
  })
})
