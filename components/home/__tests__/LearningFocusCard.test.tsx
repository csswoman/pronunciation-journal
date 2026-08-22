// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import LearningFocusCard from '../LearningFocusCard'

vi.mock('@/components/auth/AuthProvider', () => ({
  useAuth: () => ({ user: { id: 'u1' } }),
}))

const releaseFocusPin = vi.fn()
const refreshSuggestedFocus = vi.fn()

vi.mock('@/lib/learning-focus/queries', () => ({
  loadLearningFocus: vi.fn(),
  releaseFocusPin: (...a: unknown[]) => releaseFocusPin(...a),
  refreshSuggestedFocus: (...a: unknown[]) => refreshSuggestedFocus(...a),
}))

import { loadLearningFocus } from '@/lib/learning-focus/queries'

const baseFocus = {
  level: 'a1',
  thread: null,
  pinned: false,
  suggested: { level: 'a1', thread: null, source: 'profile' },
  source: 'profile',
  updatedAt: '2026-08-12T00:00:00.000Z',
}

describe('LearningFocusCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(loadLearningFocus as ReturnType<typeof vi.fn>).mockResolvedValue(baseFocus)
    refreshSuggestedFocus.mockResolvedValue(baseFocus)
  })

  it('shows the suggested focus and sends level edits to Profile', async () => {
    render(
      <LearningFocusCard
        profileLevel="A1"
        routeLevel={null}
        recentTheoryLessonSlug={null}
        weakSoundKey={null}
      />,
    )
    expect(await screen.findByText(/Sugerido/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Editar en perfil/i })).toHaveAttribute(
      'href',
      '/profile',
    )
    expect(screen.queryByRole('button', { name: /A2/i })).not.toBeInTheDocument()
  })

})
