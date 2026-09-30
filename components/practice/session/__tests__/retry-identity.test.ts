// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { db } from '@/lib/db'
import { useSessionState } from '../useSessionState'
import { createSession, getOrCreateSession, loadActiveSession } from '@/lib/practice/session-store'
import type { PracticeConfig, PracticeExercise } from '@/lib/practice/types'

vi.mock('@/components/auth/AuthProvider', () => ({ useAuth: () => ({ user: { id: 'user-1' } }) }))
vi.mock('@/hooks/useVoiceRotation', () => ({ useVoiceRotation: () => ({ currentVoice: 'a', nextVoice: vi.fn() }) }))
vi.mock('@/lib/ui-sounds/cues', () => ({ playUiCue: vi.fn() }))
vi.mock('@/lib/progress/activity-hub', () => ({ recordActivitySession: vi.fn(async () => undefined) }))
vi.mock('@/lib/supabase/client', () => ({ getSupabaseBrowserClient: () => { throw new Error('offline') } }))
vi.mock('@/lib/sync/sync-manager', async (original) => ({
  ...await original<typeof import('@/lib/sync/sync-manager')>(),
  flushOutbox: vi.fn(async () => ({ failed: 0, skipped: 0 })),
}))

const exercise: PracticeExercise = {
  id: 'pick-seat', slug: 'pick_word', exerciseTypeId: 1, soundId: 42,
  contentId: 'seat', context: 'sound_lab', payload: {
    kind: 'phoneme', ipa: 'iː', targetWord: 'seat', correctIds: ['seat'],
    options: [{ id: 'seat', label: 'seat', isCorrect: true }, { id: 'sit', label: 'sit', isCorrect: false }],
  },
}
const config: PracticeConfig = {
  context: 'sound_lab', exercises: [exercise], onSessionComplete: vi.fn(),
  persistence: { userId: 'user-1', soundId: 42 },
}
beforeEach(async () => { db.close(); await db.delete(); await db.open() })
afterEach(() => db.close())

describe('phoneme interaction identity', () => {
  it('atomic initial creation shares identity across tabs; restart creates a new identity', async () => {
    const params = { userId: 'user-1', soundId: 42, exercises: [exercise] }
    const [a, b] = await Promise.all([getOrCreateSession(params), getOrCreateSession(params)])
    expect(a.sessionId).toBe(b.sessionId)
    expect((await createSession(params)).sessionId).not.toBe(a.sessionId)
  })
  it('restores hints and retains a single failed evaluation after correction', async () => {
    const first = renderHook(() => useSessionState(config))
    await waitFor(() => expect(first.result.current.ready).toBe(true))
    await act(async () => { await first.result.current.handleSubmit(false, 'sit') })
    expect(first.result.current.phase).toBe('hints')
    const failed = first.result.current.results[0]
    expect((await loadActiveSession('user-1', 42))?.phase).toBe('hints')
    first.unmount()
    const resumed = renderHook(() => useSessionState(config))
    await waitFor(() => expect(resumed.result.current.ready).toBe(true))
    expect(resumed.result.current.phase).toBe('hints')
    act(() => resumed.result.current.handleRetry())
    await act(async () => { await resumed.result.current.handleSubmit(true, 'seat') })
    expect(resumed.result.current.results).toEqual([failed])
    const answers = (await db.syncOutbox.toArray()).filter(row => row.table === 'answer_history')
    expect(answers).toHaveLength(1)
    expect(answers[0].payload.is_correct).toBe(false)
    resumed.unmount()
  })
  it('two restored tabs submit the same persisted interaction only once', async () => {
    await getOrCreateSession({ userId: 'user-1', soundId: 42, exercises: [exercise] })
    const a = renderHook(() => useSessionState(config))
    const b = renderHook(() => useSessionState(config))
    await waitFor(() => expect(a.result.current.ready && b.result.current.ready).toBe(true))
    await act(async () => { await Promise.all([a.result.current.handleSubmit(false, 'sit'), b.result.current.handleSubmit(false, 'sit')]) })
    expect(await db.practiceAttemptReceipts.count()).toBe(1)
    expect((await db.syncOutbox.toArray()).filter(row => row.table === 'answer_history')).toHaveLength(1)
    a.unmount(); b.unmount()
  })
})
