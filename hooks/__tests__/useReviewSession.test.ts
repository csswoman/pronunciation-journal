// @vitest-environment jsdom
import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useReviewSession } from '../useReviewSession'
import type { ReviewPlan } from '@/lib/practice/daily-plan/composer'
import type { ReviewHubSummary } from '@/lib/review/types'

const mockUser = { id: 'user-review-123' }
let currentMockUser: { id: string } | null = mockUser

vi.mock('@/components/auth/AuthProvider', () => ({
  useAuth: () => ({ user: currentMockUser }),
}))

vi.mock('@/lib/learner-level/client-queries', () => ({
  getEffectiveLearnerLevel: vi.fn(async () => ({ level: 'B1', source: 'placement' })),
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

const summary = {
  failedSentences: [], weakWords: [], dueWords: [], soundsDue: [], dueTopics: [], weakTopics: [],
  dueLessons: [], essentialWordsDue: [], canStartReview: true, nothingDue: false,
  counts: {
    failedSentences: 0, weakWords: 0, dueWords: 0, soundsDue: 0, dueTopics: 0,
    weakTopics: 0, dueLessons: 0, essentialWordsDue: 0, executable: 1, elsewhere: 0, total: 1
  },
} as ReviewHubSummary

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
      void result.current.startReview(summary)
    })

    await waitFor(() => {
      expect(result.current.state.phase).toBe('session')
    })

    if (result.current.state.phase === 'session') {
      expect(result.current.state.steps.length).toBe(2)
      expect(result.current.state.stepIndex).toBe(0)
    }
    expect(mockBuildReviewPlan).toHaveBeenCalledWith(mockUser.id, expect.objectContaining({
      failedItems: summary.failedSentences,
      dueWords: summary.dueWords,
      dueLessons: summary.dueLessons,
      essentialWordsDue: summary.essentialWordsDue,
      includeChunkReview: true,
      learnerLevel: 'B1',
    }))
  })

  it('advances steps and marks done at the end of queue', async () => {
    mockBuildReviewPlan.mockResolvedValueOnce(sampleReviewPlan)

    const { result } = renderHook(() => useReviewSession())

    act(() => {
      void result.current.startReview(summary)
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
      void result.current.startReview(summary)
    })

    await waitFor(() => {
      expect(result.current.state.phase).toBe('session')
    })

    act(() => {
      result.current.exitSession()
    })

    expect(result.current.state.phase).toBe('idle')
  })

  it('startCategoryReview scopes the plan to the chosen domain only', async () => {
    mockBuildReviewPlan.mockResolvedValueOnce(sampleReviewPlan)

    const scopedSummary = {
      ...summary,
      weakWords: [{ id: 'w1' }] as unknown as ReviewHubSummary['weakWords'],
      dueWords: [{ id: 'w2' }] as unknown as ReviewHubSummary['dueWords'],
      soundsDue: [{ soundId: 3 }] as unknown as ReviewHubSummary['soundsDue'],
    }

    const { result } = renderHook(() => useReviewSession())

    act(() => {
      void result.current.startCategoryReview(scopedSummary, 'weak_words')
    })

    await waitFor(() => {
      expect(result.current.state.phase).toBe('session')
    })

    expect(mockBuildReviewPlan).toHaveBeenCalledWith(mockUser.id, expect.objectContaining({
      weakWords: scopedSummary.weakWords,
      dueWords: [],
      dueSoundIds: [],
      failedItems: [],
      includeChunkReview: false,
    }))
    // Category sessions never fetch grammar topics — they stay scoped.
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('startShortReview truncates the composed plan to at most 10 exercises', async () => {
    const exercise = { id: 'ex', slug: 'fill_blank', exerciseTypeId: 5 } as unknown as import('@/lib/practice/types').PracticeExercise
    const longPlan: ReviewPlan = {
      steps: [
        {
          id: 'step-a',
          kind: 'word_review',
          title: 'A',
          subtitle: 'A',
          icon: 'BookOpen',
          exercises: Array.from({ length: 7 }, (_, i) => ({ ...exercise, id: `a-${i}` })),
          estMinutes: 5,
        },
        {
          id: 'step-b',
          kind: 'word_review',
          title: 'B',
          subtitle: 'B',
          icon: 'BookOpen',
          exercises: Array.from({ length: 7 }, (_, i) => ({ ...exercise, id: `b-${i}` })),
          estMinutes: 5,
        },
      ],
      totalExercises: 14,
      nothingDue: false,
    }
    mockBuildReviewPlan.mockResolvedValueOnce(longPlan)

    const { result } = renderHook(() => useReviewSession())

    act(() => {
      void result.current.startShortReview(summary)
    })

    await waitFor(() => {
      expect(result.current.state.phase).toBe('session')
    })

    if (result.current.state.phase === 'session') {
      const totalExercises = result.current.state.steps.reduce((sum, step) => sum + step.exercises.length, 0)
      expect(totalExercises).toBeLessThanOrEqual(10)
    }
  })
})
