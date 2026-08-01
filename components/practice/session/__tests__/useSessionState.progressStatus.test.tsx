// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useSessionState } from '../useSessionState'
import type { PracticeExercise } from '@/lib/practice/types'

const mockUser = { id: 'user-1' } as const

vi.mock('@/components/auth/AuthProvider', () => ({
  useAuth: () => ({ user: mockUser }),
}))

vi.mock('@/lib/practice/queries', () => ({
  savePracticeAnswer: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/progress/activity-hub', () => ({
  recordActivitySession: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/essential-words/grade', () => ({
  gradeEssentialWord: vi.fn().mockResolvedValue(undefined),
}))

const flushOutbox = vi.fn()
vi.mock('@/lib/sync/sync-manager', () => ({
  flushOutbox: (...args: unknown[]) => flushOutbox(...args),
}))

vi.mock('@/lib/practice/session-store', () => ({
  createSession: vi.fn().mockResolvedValue(undefined),
  deleteSession: vi.fn().mockResolvedValue(undefined),
  evictExpiredSessions: vi.fn().mockResolvedValue(undefined),
  loadActiveSession: vi.fn().mockResolvedValue(null),
  updateSessionProgress: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/hooks/useVoiceRotation', () => ({
  useVoiceRotation: () => ({ currentVoice: 'a', nextVoice: vi.fn() }),
}))

vi.mock('@/lib/ui-sounds/cues', () => ({ playUiCue: vi.fn() }))

const exercise: PracticeExercise = {
  id: 'ex-1',
  slug: 'fill_blank',
  exerciseTypeId: 5,
  contentId: 'word-1',
  soundId: null,
  sourceRef: undefined,
  payload: { kind: 'generic', data: { topic: undefined } },
} as unknown as PracticeExercise

function buildConfig() {
  return {
    context: 'practice' as const,
    exercises: [exercise],
    onSessionComplete: vi.fn(),
  }
}

describe('useSessionState progress save status', () => {
  beforeEach(() => {
    flushOutbox.mockReset()
  })

  it('reports synced when the flush pass has no failed or skipped operations', async () => {
    flushOutbox.mockResolvedValue({ synced: 1, failed: 0, skipped: 0, operations: [] })
    const { result } = renderHook(() => useSessionState(buildConfig()))

    await act(async () => {
      await result.current.handleSubmit(true, 'answer')
    })
    await act(async () => {
      result.current.handleHintContinue()
    })

    await waitFor(() => expect(result.current.progressSaveStatus).toBe('synced'))
  })

  it('reports saved_local when the flush pass leaves failed or skipped operations', async () => {
    flushOutbox.mockResolvedValue({
      synced: 0,
      failed: 1,
      skipped: 0,
      operations: [{ id: 1, table: 'answer_history', operation: 'insert', outcome: 'failed', errorMessage: 'offline' }],
    })
    const { result } = renderHook(() => useSessionState(buildConfig()))

    await act(async () => {
      await result.current.handleSubmit(true, 'answer')
    })
    await act(async () => {
      result.current.handleHintContinue()
    })

    await waitFor(() => expect(result.current.progressSaveStatus).toBe('saved_local'))
  })

  it('never overwrites an earlier answer enqueue error with a later flush success', async () => {
    const { savePracticeAnswer } = await import('@/lib/practice/queries')
    vi.mocked(savePracticeAnswer).mockRejectedValueOnce(new Error('write failed'))
    flushOutbox.mockResolvedValue({ synced: 1, failed: 0, skipped: 0, operations: [] })

    const { result } = renderHook(() => useSessionState(buildConfig()))

    await act(async () => {
      await result.current.handleSubmit(true, 'answer')
    })
    expect(result.current.progressSaveStatus).toBe('error')

    await act(async () => {
      result.current.handleHintContinue()
    })

    await waitFor(() => expect(result.current.phase).toBe('complete'))
    expect(result.current.progressSaveStatus).toBe('error')
  })

  it('lets a manual retry recover from saved_local once the outbox fully drains', async () => {
    flushOutbox.mockResolvedValue({ synced: 0, failed: 1, skipped: 0, operations: [] })
    const { result } = renderHook(() => useSessionState(buildConfig()))

    await act(async () => {
      await result.current.handleSubmit(true, 'answer')
    })
    await act(async () => {
      result.current.handleHintContinue()
    })
    await waitFor(() => expect(result.current.progressSaveStatus).toBe('saved_local'))

    flushOutbox.mockResolvedValue({ synced: 1, failed: 0, skipped: 0, operations: [] })
    await act(async () => {
      result.current.handleRetrySync()
    })

    await waitFor(() => expect(result.current.progressSaveStatus).toBe('synced'))
  })
})
