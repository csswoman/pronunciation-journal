// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useDailyPlan } from '../useDailyPlan'
import type { DailyPlan } from '@/lib/practice/types'

const mockUser = { id: 'test-user-456' }
let currentMockUser: { id: string } | null = mockUser

vi.mock('@/components/auth/AuthProvider', () => ({
  useAuth: () => ({ user: currentMockUser }),
}))

const mockCachedPlan: DailyPlan = {
  totalExercises: 3,
  isNewUser: false,
  steps: [
    {
      id: 'step-1',
      kind: 'word_review',
      title: 'Review 1',
      subtitle: 'Vocabulario',
      icon: 'BookOpen',
      exercises: [],
      estMinutes: 3,
    },
  ],
  arc: {
    soundIpa: null,
    topicLabel: 'General',
    sessionWords: ['test'],
  },
}

const mockBuiltPlan: DailyPlan = {
  totalExercises: 3,
  isNewUser: false,
  steps: [
    {
      id: 'step-built-1',
      kind: 'phoneme_focus',
      title: 'Phoneme practice',
      subtitle: 'Sonidos',
      icon: 'Volume2',
      exercises: [],
      estMinutes: 3,
    },
  ],
  arc: {
    soundIpa: 'æ',
    topicLabel: 'Pronunciación',
    sessionWords: ['cat'],
  },
}

let storedCachedPlan: DailyPlan | null = null
const mockLoadCachedDailyPlan = vi.fn(() => storedCachedPlan)
const mockSaveCachedDailyPlan = vi.fn((_uid: string, plan: DailyPlan) => {
  storedCachedPlan = plan
})

vi.mock('@/lib/daily/plan-storage', () => ({
  loadCachedDailyPlan: () => mockLoadCachedDailyPlan(),
  saveCachedDailyPlan: (uid: string, plan: DailyPlan) => mockSaveCachedDailyPlan(uid, plan),
  loadDoneIds: vi.fn(() => new Set<string>()),
  loadResolvedIds: vi.fn(() => new Set<string>()),
  saveDoneIds: vi.fn(),
  saveResolvedIds: vi.fn(),
}))

vi.mock('@/lib/progress/activity-queries-client', () => ({
  syncTodayReconciledSteps: vi.fn().mockResolvedValue(new Set<string>()),
}))

const mockBuildDailyPlan = vi.fn()
vi.mock('@/lib/practice/daily-plan/composer', () => ({
  buildDailyPlan: (...args: unknown[]) => mockBuildDailyPlan(...args),
}))

describe('useDailyPlan', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    storedCachedPlan = null
    currentMockUser = mockUser
  })

  it('restores cached plan immediately and does NOT call the heavy composer', async () => {
    storedCachedPlan = mockCachedPlan

    const { result } = renderHook(() =>
      useDailyPlan({ conceptLesson: null, autoLoad: true }),
    )

    await waitFor(() => {
      expect(result.current.status).toBe('ready')
    })

    expect(result.current.plan).toBeDefined()
    expect(result.current.steps.length).toBeGreaterThan(0)
    expect(result.current.steps[0].id).toBe('step-1')
    expect(mockBuildDailyPlan).not.toHaveBeenCalled()
  })

  it('calls buildDailyPlan exactly once when cache is empty and saves to cache', async () => {
    storedCachedPlan = null
    mockBuildDailyPlan.mockResolvedValueOnce(mockBuiltPlan)

    const { result } = renderHook(() =>
      useDailyPlan({ conceptLesson: null, autoLoad: true }),
    )

    await waitFor(() => {
      expect(result.current.status).toBe('ready')
    })

    expect(mockBuildDailyPlan).toHaveBeenCalledTimes(1)
    expect(mockBuildDailyPlan).toHaveBeenCalledWith('test-user-456')
    expect(result.current.steps[0].id).toBe('step-built-1')
    expect(mockSaveCachedDailyPlan).toHaveBeenCalled()
  })

  it('transitions to status: error when buildDailyPlan fails', async () => {
    storedCachedPlan = null
    mockBuildDailyPlan.mockRejectedValueOnce(new Error('Network or Dexie error'))

    const { result } = renderHook(() =>
      useDailyPlan({ conceptLesson: null, autoLoad: true }),
    )

    await waitFor(() => {
      expect(result.current.status).toBe('error')
    })

    expect(result.current.plan).toBeNull()
  })

  it('does nothing when user is null', async () => {
    currentMockUser = null

    const { result } = renderHook(() =>
      useDailyPlan({ conceptLesson: null, autoLoad: true }),
    )

    expect(result.current.status).toBe('loading')
    expect(mockBuildDailyPlan).not.toHaveBeenCalled()
    expect(mockLoadCachedDailyPlan).not.toHaveBeenCalled()
  })
})
