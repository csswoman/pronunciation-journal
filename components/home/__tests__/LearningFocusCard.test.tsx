// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import LearningFocusCard from '../LearningFocusCard'

vi.mock('@/components/auth/AuthProvider', () => ({
  useAuth: () => ({ user: { id: 'u1' } }),
}))

vi.mock('@/hooks/useUserPreferences', () => ({
  useUserPreferences: () => ({ preferences: null, loading: false }),
}))

const pinFocus = vi.fn()
const releaseFocusPin = vi.fn()
const refreshSuggestedFocus = vi.fn()

vi.mock('@/lib/learning-focus/queries', () => ({
  loadLearningFocus: vi.fn(),
  pinFocus: (...a: unknown[]) => pinFocus(...a),
  releaseFocusPin: (...a: unknown[]) => releaseFocusPin(...a),
  refreshSuggestedFocus: (...a: unknown[]) => refreshSuggestedFocus(...a),
  claimTheoryTopics: vi.fn(),
  listClaimedTheoryTopics: vi.fn().mockResolvedValue([]),
}))

import { loadLearningFocus } from '@/lib/learning-focus/queries'

describe('LearningFocusCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(loadLearningFocus as ReturnType<typeof vi.fn>).mockResolvedValue({
      level: 'a1',
      thread: null,
      pinned: false,
      suggested: { level: 'a1', thread: null, source: 'profile' },
      source: 'profile',
      updatedAt: '2026-08-12T00:00:00.000Z',
    })
    refreshSuggestedFocus.mockResolvedValue({
      level: 'a1',
      thread: null,
      pinned: false,
      suggested: { level: 'a1', thread: null, source: 'profile' },
      source: 'profile',
      updatedAt: '2026-08-12T00:00:00.000Z',
    })
  })

  it('shows Sugerido and can pin a focus level', async () => {
    pinFocus.mockResolvedValue({
      level: 'a2',
      thread: null,
      pinned: true,
      suggested: { level: 'a1', thread: null, source: 'profile' },
      source: 'manual',
      updatedAt: '2026-08-12T01:00:00.000Z',
    })
    render(
      <LearningFocusCard
        profileLevel="A1"
        routeLevel={null}
        recentTheoryLessonSlug={null}
        weakSoundKey={null}
      />,
    )
    expect(await screen.findByText(/Sugerido/i)).toBeInTheDocument()
    fireEvent.click(await screen.findByRole('button', { name: /A2/i }))
    await waitFor(() => expect(pinFocus).toHaveBeenCalled())
    expect(await screen.findByText(/Fijado/i)).toBeInTheDocument()
  })
})
