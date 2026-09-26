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

describe('HomePageHeader', () => {
  it('shows weekly minutes subtitle', () => {
    render(
      <HomePageHeader
        weekMinutes={20}
        isNewLearner={false}
      />,
    )
    expect(screen.getByText(/20 min esta semana/i)).toBeInTheDocument()
  })

  it('keeps first-visit orientation when there is no retention signal', () => {
    render(
      <HomePageHeader
        weekMinutes={0}
        isNewLearner
      />,
    )
    expect(screen.getByText(/camino más corto/i)).toBeInTheDocument()
  })
})
