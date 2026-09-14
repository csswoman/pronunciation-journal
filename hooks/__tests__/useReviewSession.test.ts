// @vitest-environment jsdom
import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useReviewSession } from '../useReviewSession'
import type { ReviewPlan } from '@/lib/practice/daily-plan/composer'

const mockUser = { id: 'user-review-123' }
let currentMockUser: { id: string } | null = mockUser

vi.mock('@/components/auth/AuthProvider', () => ({
  useAuth: () => ({ user: currentMockUser }),
}))

const mockBuildReviewPlan = vi.fn()
vi.mock('@/lib/practice/daily-plan', () => ({
  buildReviewPlan: (...args: unknown[]) => mockBuildReviewPlan(...args),
}))

const sampleReviewPlan: ReviewPlan = {
  steps: [
    {
      id: 'rev-step-1',
      kind: 'word_review',
      title: 'Review Step 1',
      subtitle: 'Word Review',
      icon: 'BookOpen',
      exercises: [],
      estMinutes: 3,
    },
    {
      id: 'rev-step-2',
      kind: 'phoneme_focus',
      title: 'Review Step 2',
      subtitle: 'Phoneme Focus',
      icon: 'Volume2',
      exercises: [],
      estMinutes: 3,
    },
  ],
  totalExercises: 2,
  nothingDue: false,
}

describe('useReviewSession', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    currentMockUser = mockUser
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ steps: [] }),
    }) as unknown as typeof fetch
  })

  it('starts in phase: idle', () => {
    const { result } = renderHook(() => useReviewSession())
    expect(result.current.state.phase).toBe('idle')
  })

  it('starts review queue and transitions to session', async () => {
    mockBuildReviewPlan.mockResolvedValueOnce(sampleReviewPlan)

    const { result } = renderHook(() => useReviewSession())

    act(() => {
      void result.current.startReview()
    })

    await waitFor(() => {
      expect(result.current.state.phase).toBe('session')
    })

    if (result.current.state.phase === 'session') {
      expect(result.current.state.steps.length).toBe(2)
      expect(result.current.state.stepIndex).toBe(0)
    }
  })

  it('advances steps and marks done at the end of queue', async () => {
    mockBuildReviewPlan.mockResolvedValueOnce(sampleReviewPlan)

    const { result } = renderHook(() => useReviewSession())

    act(() => {
      void result.current.startReview()
    })

    await waitFor(() => {
      expect(result.current.state.phase).toBe('session')
    })

    act(() => {
      result.current.advanceStep()
    })

    expect(result.current.state.phase).toBe('session')
    if (result.current.state.phase === 'session') {
      expect(result.current.state.stepIndex).toBe(1)
    }

    act(() => {
      result.current.advanceStep()
    })

    expect(result.current.state.phase).toBe('done')
  })

  it('allows exiting session back to idle', async () => {
    mockBuildReviewPlan.mockResolvedValueOnce(sampleReviewPlan)

    const { result } = renderHook(() => useReviewSession())

    act(() => {
      void result.current.startReview()
    })

    await waitFor(() => {
      expect(result.current.state.phase).toBe('session')
    })

    act(() => {
      result.current.exitSession()
    })

    expect(result.current.state.phase).toBe('idle')
  })
})
