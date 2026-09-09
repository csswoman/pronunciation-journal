// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import BottomNavTab from '../BottomNavTab'
import BottomNavDrawer from '../BottomNavDrawer'
import { playUiCue, isNavCuesEnabled } from '@/lib/ui-sounds/cues'
import { useUISoundsStore } from '@/lib/stores/uiSoundsStore'

vi.mock('@/lib/ui-sounds/cues', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/ui-sounds/cues')>()
  return {
    ...actual,
    playUiCue: vi.fn(),
  }
})

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}))

vi.mock('@/components/auth/AuthProvider', () => ({
  useAuth: () => ({ user: { id: 'u1' }, signOutUser: vi.fn() }),
}))

vi.mock('@/hooks/useUserPreferences', () => ({
  useUserPreferences: () => ({ preferences: { full_name: 'Test User' } }),
}))

describe('Navigation Domain Sound Triggering & Double-Trigger Prevention', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useUISoundsStore.setState({ soundPreference: 'all', soundEnabled: true })
  })

  it('plays nav-switch exactly once when clicking an inactive BottomNavTab', () => {
    render(
      <BottomNavTab
        name="Práctica"
        href="/practice"
        active={false}
        icon={<span>Icon</span>}
      />
    )

    const tab = screen.getByRole('link', { name: /práctica/i })
    fireEvent.click(tab)

    expect(playUiCue).toHaveBeenCalledTimes(1)
    expect(playUiCue).toHaveBeenCalledWith('nav-switch')
  })

  it('does NOT trigger nav-switch when clicking an already active BottomNavTab', () => {
    render(
      <BottomNavTab
        name="Inicio"
        href="/"
        active={true}
        icon={<span>Icon</span>}
      />
    )

    const tab = screen.getByRole('link', { name: /inicio/i })
    fireEvent.click(tab)

    expect(playUiCue).not.toHaveBeenCalled()
  })

  it('plays ONLY nav-switch (and 0 nav-close) when clicking a nav link in BottomNavDrawer', () => {
    const onClose = vi.fn()
    render(
      <BottomNavDrawer
        open={true}
        onClose={onClose}
        isActive={(href) => href === '/profile'}
      />
    )

    const journalLink = screen.getByRole('link', { name: /mi diario/i })
    fireEvent.click(journalLink)

    expect(playUiCue).toHaveBeenCalledTimes(1)
    expect(playUiCue).toHaveBeenCalledWith('nav-switch')
    expect(playUiCue).not.toHaveBeenCalledWith('nav-close')
    expect(onClose).toHaveBeenCalled()
  })

  it('plays ONLY nav-close when dismissing BottomNavDrawer via backdrop', () => {
    const onClose = vi.fn()
    render(
      <BottomNavDrawer
        open={true}
        onClose={onClose}
        isActive={() => false}
      />
    )

    const backdrop = document.querySelector('[role="presentation"]')
    expect(backdrop).toBeTruthy()
    if (backdrop) fireEvent.click(backdrop)

    expect(playUiCue).toHaveBeenCalledTimes(1)
    expect(playUiCue).toHaveBeenCalledWith('nav-close')
    expect(onClose).toHaveBeenCalled()
  })

  it('respects runtime kill switch via localStorage without deploy', () => {
    window.localStorage.setItem('disable-nav-cues', 'true')
    expect(isNavCuesEnabled()).toBe(false)
    window.localStorage.removeItem('disable-nav-cues')
    expect(isNavCuesEnabled()).toBe(true)
  })
})
