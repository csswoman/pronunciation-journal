// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import LearningFocusCard from '../LearningFocusCard'

vi.mock('@/components/auth/AuthProvider', () => ({
  useAuth: () => ({ user: { id: 'u1' } }),
}))

const pinFocus = vi.fn()
const releaseFocusPin = vi.fn()
const refreshSuggestedFocus = vi.fn()
const listClaimedTheoryTopics = vi.fn()

vi.mock('@/lib/learning-focus/queries', () => ({
  loadLearningFocus: vi.fn(),
  pinFocus: (...a: unknown[]) => pinFocus(...a),
  releaseFocusPin: (...a: unknown[]) => releaseFocusPin(...a),
  refreshSuggestedFocus: (...a: unknown[]) => refreshSuggestedFocus(...a),
  claimTheoryTopics: vi.fn(),
  listClaimedTheoryTopics: (...a: unknown[]) => listClaimedTheoryTopics(...a),
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
    listClaimedTheoryTopics.mockResolvedValue([])
  })

  it('shows Sugerido and can pin a focus level', async () => {
    pinFocus.mockResolvedValue({
      ...baseFocus,
      level: 'a2',
      pinned: true,
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

  it('disables checkboxes for already-claimed topics in the sheet', async () => {
    listClaimedTheoryTopics.mockResolvedValue([
      {
        lessonSlug: 'a1-presente-simple',
        level: 'a1',
        title: 'Hábitos y rutinas (presente simple)',
      },
    ])
    render(
      <LearningFocusCard
        profileLevel="A1"
        routeLevel={null}
        recentTheoryLessonSlug={null}
        weakSoundKey={null}
      />,
    )
    await screen.findByText(/Sugerido/i)
    fireEvent.click(screen.getByRole('button', { name: /Temas que ya sé/i }))
    const claimed = await screen.findByRole('checkbox', {
      name: /Hábitos y rutinas \(presente simple\)/i,
    })
    expect(claimed).toBeChecked()
    expect(claimed).toBeDisabled()
  })
})
