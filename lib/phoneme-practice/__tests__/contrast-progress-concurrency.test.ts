import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '@/lib/db'
import {
  updateContrastProgress,
} from '@/lib/phoneme-practice/contrast-queries'
import type { SRResult } from '@/lib/phoneme-practice/types'

const { mockEnqueue, mockFrom } = vi.hoisted(() => ({
  mockEnqueue: vi.fn(),
  mockFrom: vi.fn(),
}))

vi.mock('@/lib/sync/sync-manager', () => ({
  enqueue: mockEnqueue,
}))

vi.mock('@/lib/supabase/client', () => ({
  getSupabaseBrowserClient: () => ({
    from: mockFrom,
  }),
}))

const defaultSR: SRResult = {
  streak: 2,
  ease_factor: 2.5,
  interval_days: 3,
  next_review: new Date('2026-06-10T12:00:00Z'),
}

describe('contrast progress persistence and concurrency (plan 048)', () => {
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

  afterEach(() => {
    db.close()
  })

  it('serializes concurrent local projections so no offline delta is lost', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    })

    await Promise.all([
      updateContrastProgress('user-1', '/iː/|/ɪ/', 8, 10, defaultSR, 25, 80, 'att-a'),
      updateContrastProgress('user-1', '/iː/|/ɪ/', 9, 10, defaultSR, 36, 90, 'att-b'),
    ])

    const local = await db.cachedContrastProgress.get('user-1:/iː/|/ɪ/')
    expect(local?.totalAttempts).toBe(20)
    expect(local?.correctAnswers).toBe(17)
    expect(local?.masterySessionCount).toBe(2)
    expect(mockEnqueue).toHaveBeenCalledTimes(2)
  })

  it('does not double-apply the same local session while its event is queued', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    })

    const input = ['user-1', '/iː/|/ɪ/', 8, 10, defaultSR, 25, 80, 'att-replay'] as const
    await updateContrastProgress(...input)
    await updateContrastProgress(...input)

    const local = await db.cachedContrastProgress.get('user-1:/iː/|/ɪ/')
    expect(local?.totalAttempts).toBe(10)
    expect(local?.correctAnswers).toBe(8)
    expect(mockEnqueue).toHaveBeenCalledOnce()
  })

  it('simulates the locked server reducer accumulating evidence without LWW mastery loss', () => {
    // Mirrors apply_contrast_session_result: each event is deduplicated, then
    // the current row is reduced under a lock instead of accepting absolute
    // mastery values from a stale device snapshot.
    // Device A and Device B complete practice sessions offline and both sync.
    const serverDb = {
      totalAttempts: 0,
      correctAnswers: 0,
      rawMastery: 0,
      masteryPct: 0,
      masterySessionCount: 0,
      lastSeen: new Date('2026-06-01T12:00:00Z'),
      events: new Set<string>(),
    }

    function serverApplySessionResult(event: {
      attemptId: string
      total: number
      correct: number
      accuracy: number
      occurredAt: Date
    }) {
      if (serverDb.events.has(event.attemptId)) {
        return // Idempotency: duplicate skipped
      }
      serverDb.events.add(event.attemptId)
      serverDb.totalAttempts += event.total
      serverDb.correctAnswers += event.correct
      const stale = event.occurredAt < serverDb.lastSeen
      if (serverDb.masterySessionCount === 0) {
        serverDb.rawMastery = event.accuracy
      } else if (stale) {
        const priorSessions = Math.max(serverDb.masterySessionCount, 1)
        serverDb.rawMastery = Math.round(
          (serverDb.rawMastery * priorSessions + event.accuracy) / (priorSessions + 1),
        )
      } else {
        const days = Math.max(0, (event.occurredAt.getTime() - serverDb.lastSeen.getTime()) / 86_400_000)
        const decay = Math.exp(-days / 14)
        serverDb.rawMastery = Math.round(serverDb.rawMastery * decay + event.accuracy * (1 - decay))
      }
      serverDb.masterySessionCount += 1
      serverDb.masteryPct = Math.round(
        serverDb.rawMastery * Math.sqrt(Math.min(serverDb.masterySessionCount, 10) / 10),
      )
      serverDb.lastSeen = event.occurredAt > serverDb.lastSeen ? event.occurredAt : serverDb.lastSeen
    }

    const eventA = { attemptId: 'evt-dev-a', total: 10, correct: 8, accuracy: 80, occurredAt: new Date('2026-06-01T12:00:00Z') }
    const eventB = { attemptId: 'evt-dev-b', total: 10, correct: 9, accuracy: 90, occurredAt: new Date('2026-06-02T12:00:00Z') }

    // The newer event arrives first; the older offline event still contributes
    // to raw mastery without rolling back the SRS clock/state.
    serverApplySessionResult(eventB)
    serverApplySessionResult(eventA)

    // Total attempts accumulated: 10 + 10 = 20, correct: 8 + 9 = 17 (no lost updates!)
    expect(serverDb.totalAttempts).toBe(20)
    expect(serverDb.correctAnswers).toBe(17)
    expect(serverDb.rawMastery).toBeGreaterThan(80)
    expect(serverDb.masterySessionCount).toBe(2)

    // Replay of eventA (e.g. network retry) does NOT double-increment
    serverApplySessionResult(eventA)
    expect(serverDb.totalAttempts).toBe(20)
    expect(serverDb.correctAnswers).toBe(17)
  })
})
