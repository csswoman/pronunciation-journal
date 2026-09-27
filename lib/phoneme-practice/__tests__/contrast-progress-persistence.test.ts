import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '@/lib/db'
import { getContrastProgress, updateContrastProgress } from '@/lib/phoneme-practice/contrast-queries'
import type { SRResult } from '@/lib/phoneme-practice/types'

const { mockEnqueue, mockFrom } = vi.hoisted(() => ({
  mockEnqueue: vi.fn(),
  mockFrom: vi.fn(),
}))

vi.mock('@/lib/sync/sync-manager', () => ({ enqueue: mockEnqueue }))
vi.mock('@/lib/supabase/client', () => ({
  getSupabaseBrowserClient: () => ({ from: mockFrom }),
}))

const defaultSR: SRResult = {
  streak: 2,
  ease_factor: 2.5,
  interval_days: 3,
  next_review: new Date('2026-06-10T12:00:00Z'),
}

describe('contrast progress persistence (plan 048)', () => {
  beforeEach(async () => {
    db.close()
    await db.delete()
    await db.open()
    mockEnqueue.mockReset()
    mockEnqueue.mockImplementation(async (
      userId: string,
      table: string,
      operation: string,
      payload: Record<string, unknown>,
      matchKey?: Record<string, unknown>,
      onConflict?: string,
      rpcName?: string,
      bundleId?: string,
    ) => db.syncOutbox.add({
      userId,
      table: table as never,
      operation: operation as never,
      payload,
      matchKey,
      onConflict,
      rpcName: rpcName as never,
      bundleId,
      status: 'pending',
      createdAt: new Date().toISOString(),
      retryCount: 0,
    }))
    mockFrom.mockReset()
  })

  afterEach(() => db.close())

  it('persists rawMastery in Dexie and enqueues an RPC delta', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    })

    const attemptId = 'att-test-1'
    await updateContrastProgress('user-1', '/iː/|/ɪ/', 8, 10, defaultSR, 25, 80, attemptId)

    const local = await db.cachedContrastProgress.get('user-1:/iː/|/ɪ/')
    expect(local).toMatchObject({ rawMastery: 80, masteryPct: 25, totalAttempts: 10, correctAnswers: 8 })

    expect(mockEnqueue).toHaveBeenCalledOnce()
    const [userId, table, op, payload, , , rpcName, idempotencyKey] = mockEnqueue.mock.calls[0]
    expect(userId).toBe('user-1')
    expect(table).toBe('user_contrast_progress')
    expect(op).toBe('rpc')
    expect(rpcName).toBe('apply_contrast_session_result')
    expect(idempotencyKey).toBe(attemptId)
    expect(payload).toEqual(expect.objectContaining({
      p_contrast_id: '/iː/|/ɪ/',
      p_session_correct: 8,
      p_session_total: 10,
      p_raw_mastery: 80,
      p_attempt_id: attemptId,
      p_session_accuracy: 80,
      p_session_passed: true,
    }))
  })

  it('rolls back the local projection when the outbox write fails', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    })
    mockEnqueue.mockRejectedValueOnce(new Error('outbox unavailable'))

    await expect(updateContrastProgress(
      'user-1', '/iː/|/ɪ/', 8, 10, defaultSR, 25, 80, 'att-rollback',
    )).rejects.toThrow('outbox unavailable')
    expect(await db.cachedContrastProgress.get('user-1:/iː/|/ɪ/')).toBeUndefined()
  })

  it('handles offline fallback reading and upgrading a legacy row', async () => {
    const cid = '/ð/|/θ/'
    await db.cachedContrastProgress.put({
      key: `user-1:${cid}`,
      userId: 'user-1',
      contrastId: cid,
      easeFactor: 2.5,
      intervalDays: 1,
      totalAttempts: 5,
      correctAnswers: 4,
      streak: 1,
      masteryPct: 70,
      rawMastery: null,
      adaptiveScore: 0.3,
      observationCount: 2,
      nextReview: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockImplementation(() => { throw new Error('offline') }),
    })

    const read = await getContrastProgress('user-1', '/θ/|/ð/')
    expect(read).toMatchObject({ mastery_pct: 70, raw_mastery: null })

    await updateContrastProgress('user-1', '/θ/|/ð/', 5, 5, defaultSR, 85, 90, 'att-upgrade')
    const updated = await db.cachedContrastProgress.get(`user-1:${cid}`)
    expect(updated).toMatchObject({
      rawMastery: 90,
      masteryPct: 85,
      totalAttempts: 10,
      correctAnswers: 9,
      adaptiveScore: 0.3,
      observationCount: 2,
    })
  })

  it('queues a new contrast while offline even when no cache row exists', async () => {
    mockFrom.mockImplementation(() => { throw new Error('offline') })

    await updateContrastProgress(
      'user-1', '/iː/|/ɪ/', 1, 1, defaultSR, 25, 100, 'att-new-offline',
    )

    expect(await db.cachedContrastProgress.get('user-1:/iː/|/ɪ/')).toMatchObject({
      totalAttempts: 1,
      correctAnswers: 1,
      rawMastery: 100,
    })
    expect(await db.syncOutbox.where('userId').equals('user-1').count()).toBe(1)
  })
})
