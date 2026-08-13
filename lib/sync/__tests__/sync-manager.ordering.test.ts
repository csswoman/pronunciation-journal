/**
 * Plan 061 step 4: per-entity ordering + 23505 (unique_violation)
 * reclassification tests for flushOutboxInternal.
 *
 * Split out of sync-manager.test.ts to keep that file under the max-lines
 * warning threshold; shares the same mocking approach.
 */
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => {
  const mockSyncOutboxAdd = vi.fn()
  const mockSyncOutboxDelete = vi.fn()
  const mockSyncOutboxUpdate = vi.fn()
  const mockSyncOutboxModify = vi.fn()
  const mockSyncOutboxWhere = vi.fn()
  const mockDbTransaction = vi.fn()
  const mockSupabaseFrom = vi.fn()
  const mockSupabaseRpc = vi.fn()

  return {
    mockSyncOutboxAdd,
    mockSyncOutboxDelete,
    mockSyncOutboxUpdate,
    mockSyncOutboxModify,
    mockSyncOutboxWhere,
    mockDbTransaction,
    mockSupabaseFrom,
    mockSupabaseRpc,
  }
})

vi.mock('@/lib/supabase/client', () => ({
  getSupabaseBrowserClient: () => ({ from: mocks.mockSupabaseFrom, rpc: mocks.mockSupabaseRpc }),
}))

vi.mock('@/lib/db', () => ({
  db: {
    syncOutbox: {
      add: (...args: unknown[]) => mocks.mockSyncOutboxAdd(...args),
      delete: (...args: unknown[]) => mocks.mockSyncOutboxDelete(...args),
      update: (...args: unknown[]) => mocks.mockSyncOutboxUpdate(...args),
      where: (...args: unknown[]) => mocks.mockSyncOutboxWhere(...args),
    },
    transaction: (...args: unknown[]) => mocks.mockDbTransaction(...args),
  },
  ensureDbReady: () => Promise.resolve(),
}))

vi.mock('dexie', () => ({
  default: class {
    static minKey = -Infinity
    static maxKey = Infinity
  },
}))

vi.mock('../recovery', () => ({
  reclaimStaleSyncingEntries: vi.fn().mockResolvedValue(0),
  isReadyToRetry: () => true,
  getNextRetryAt: () => '2026-01-01T00:00:05.000Z',
}))

import { flushOutbox } from '../sync-manager'

function setupFlush(pendingEntries: unknown[]) {
  let callCount = 0
  mocks.mockSyncOutboxWhere.mockImplementation(() => {
    callCount++
    if (callCount === 1) {
      return {
        between: () => ({ toArray: () => Promise.resolve(pendingEntries) }),
        anyOf: () => ({ modify: mocks.mockSyncOutboxModify }),
      }
    }
    if (callCount === 2) {
      return { anyOf: () => ({ modify: mocks.mockSyncOutboxModify }) }
    }
    return { anyOf: () => ({ filter: () => ({ modify: mocks.mockSyncOutboxModify }) }) }
  })
  mocks.mockDbTransaction.mockImplementation(
    async (_mode: string, _tables: unknown, fn: () => Promise<unknown>) => fn()
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  Object.defineProperty(globalThis, 'navigator', {
    value: { onLine: true },
    writable: true,
    configurable: true,
  })
  mocks.mockSyncOutboxModify.mockResolvedValue(0)
  mocks.mockSyncOutboxDelete.mockResolvedValue(undefined)
  mocks.mockSyncOutboxUpdate.mockResolvedValue(1)
})

// ── Per-entity ordering ──────────────────────────────────────────────────

describe('flushOutbox per-entity ordering', () => {
  it('processes two entries for the SAME entity (same rpc + word id) strictly in order', async () => {
    const callOrder: string[] = []
    const entries = [
      {
        id: 31, table: 'word_bank', operation: 'rpc', rpcName: 'apply_word_bank_rating_event',
        payload: { p_idempotency_key: 'key-1', p_user_id: 'u1', p_word_id: 'word-A', p_grade: 4 },
        status: 'pending', retryCount: 0, createdAt: new Date().toISOString(),
      },
      {
        id: 32, table: 'word_bank', operation: 'rpc', rpcName: 'apply_word_bank_rating_event',
        payload: { p_idempotency_key: 'key-2', p_user_id: 'u1', p_word_id: 'word-A', p_grade: 5 },
        status: 'pending', retryCount: 0, createdAt: new Date().toISOString(),
      },
    ]
    setupFlush(entries)

    // The FIRST call resolves only after we release it; the SECOND call must
    // not even be invoked until the first has resolved, proving order.
    let releaseFirst: () => void
    const firstGate = new Promise<void>((resolve) => { releaseFirst = resolve })
    mocks.mockSupabaseRpc.mockImplementation(async (_name: string, args: { p_idempotency_key: string }) => {
      callOrder.push(`start:${args.p_idempotency_key}`)
      if (args.p_idempotency_key === 'key-1') {
        await firstGate
      }
      callOrder.push(`end:${args.p_idempotency_key}`)
      return { error: null }
    })

    const flushPromise = flushOutbox('user-1')

    // Give the microtask queue a chance to start entry 1 but not entry 2.
    await vi.waitFor(() => expect(callOrder).toContain('start:key-1'))
    expect(callOrder).not.toContain('start:key-2')

    releaseFirst!()
    await flushPromise

    expect(callOrder).toEqual(['start:key-1', 'end:key-1', 'start:key-2', 'end:key-2'])
  })

  it('runs entries for DIFFERENT entities concurrently (both in-flight simultaneously)', async () => {
    const entries = [
      {
        id: 41, table: 'word_bank', operation: 'rpc', rpcName: 'apply_word_bank_rating_event',
        payload: { p_idempotency_key: 'key-a', p_user_id: 'u1', p_word_id: 'word-A', p_grade: 4 },
        status: 'pending', retryCount: 0, createdAt: new Date().toISOString(),
      },
      {
        id: 42, table: 'word_bank', operation: 'rpc', rpcName: 'apply_word_bank_rating_event',
        payload: { p_idempotency_key: 'key-b', p_user_id: 'u1', p_word_id: 'word-B', p_grade: 4 },
        status: 'pending', retryCount: 0, createdAt: new Date().toISOString(),
      },
    ]
    setupFlush(entries)

    const inFlight = new Set<string>()
    let bothInFlightSimultaneously = false
    const releases: Record<string, () => void> = {}
    mocks.mockSupabaseRpc.mockImplementation(async (_name: string, args: { p_idempotency_key: string }) => {
      inFlight.add(args.p_idempotency_key)
      if (inFlight.size === 2) bothInFlightSimultaneously = true
      await new Promise<void>((resolve) => { releases[args.p_idempotency_key] = resolve })
      inFlight.delete(args.p_idempotency_key)
      return { error: null }
    })

    const flushPromise = flushOutbox('user-1')

    await vi.waitFor(() => expect(inFlight.size).toBe(2))
    expect(bothInFlightSimultaneously).toBe(true)

    releases['key-a']()
    releases['key-b']()
    await flushPromise
  })

  it('gives each malformed upsert entry (missing a resolved onConflict column) its own independent entity key and warns loudly', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    // Both entries target the same table/onConflict but are missing the
    // `contrast_id` column value in the payload — a producer bug. They must
    // NOT collide onto the same "undefined"-tainted key; each should be
    // independent and free to run concurrently.
    const entries = [
      {
        id: 61, table: 'user_contrast_progress', operation: 'upsert',
        payload: { some_other_col: 'x' },
        onConflict: 'contrast_id',
        status: 'pending', retryCount: 0, createdAt: new Date().toISOString(),
      },
      {
        id: 62, table: 'user_contrast_progress', operation: 'upsert',
        payload: { some_other_col: 'y' },
        onConflict: 'contrast_id',
        status: 'pending', retryCount: 0, createdAt: new Date().toISOString(),
      },
    ]
    setupFlush(entries)

    const inFlight = new Set<number>()
    let bothInFlightSimultaneously = false
    const releases: Record<number, () => void> = {}
    const mockUpsert = vi.fn(async (payload: Record<string, unknown>) => {
      const id = payload.some_other_col === 'x' ? 61 : 62
      inFlight.add(id)
      if (inFlight.size === 2) bothInFlightSimultaneously = true
      await new Promise<void>((resolve) => { releases[id] = resolve })
      inFlight.delete(id)
      return { error: null }
    })
    mocks.mockSupabaseFrom.mockReturnValue({ upsert: mockUpsert })

    const flushPromise = flushOutbox('user-1')

    await vi.waitFor(() => expect(inFlight.size).toBe(2))
    expect(bothInFlightSimultaneously).toBe(true)

    releases[61]()
    releases[62]()
    await flushPromise

    expect(warnSpy).toHaveBeenCalled()
    const warnedMessages = warnSpy.mock.calls.map((call) => String(call[0]))
    expect(warnedMessages.some((msg) => msg.includes('user_contrast_progress') && msg.includes('contrast_id'))).toBe(true)

    warnSpy.mockRestore()
  })

  it('builds a multi-column onConflict entity key when the payload carries all resolved columns', async () => {
    const entry = {
      id: 63, table: 'user_contrast_progress', operation: 'upsert',
      payload: { user_id: 'u1', contrast_id: 'c1' },
      status: 'pending', retryCount: 0, createdAt: new Date().toISOString(),
    }
    setupFlush([entry])
    const upsert = vi.fn().mockResolvedValue({ error: null })
    mocks.mockSupabaseFrom.mockReturnValue({ upsert })

    const result = await flushOutbox('user-1')

    expect(upsert).toHaveBeenCalledWith(
      { user_id: 'u1', contrast_id: 'c1' },
      { onConflict: 'user_id,contrast_id' },
    )
    expect(result.synced).toBe(1)
  })
})

// ── 23505 (unique_violation) reclassification ───────────────────────────

describe('23505 (unique_violation) reclassification', () => {
  it('treats a 23505 on an rpc entry carrying p_idempotency_key as idempotent success (deletes entry, counts as synced)', async () => {
    const entry = {
      id: 51, table: 'word_bank', operation: 'rpc', rpcName: 'apply_word_bank_rating_event',
      payload: { p_idempotency_key: 'key-dup', p_user_id: 'u1', p_word_id: 'word-A', p_grade: 4 },
      status: 'pending', retryCount: 1, createdAt: new Date().toISOString(),
    }
    setupFlush([entry])
    mocks.mockSupabaseRpc.mockResolvedValue({
      error: { message: 'duplicate key value violates unique constraint "srs_rating_events_idempotency_key_unique"', code: '23505' },
    })

    const result = await flushOutbox('user-1')

    expect(mocks.mockSyncOutboxDelete).toHaveBeenCalledWith(51)
    expect(mocks.mockSyncOutboxUpdate).not.toHaveBeenCalledWith(51, expect.anything())
    expect(result.synced).toBe(1)
    expect(result.failed).toBe(0)
  })

  it('still treats a 23505 on a plain upsert (no idempotency key) as a genuine permanent failure', async () => {
    const entry = {
      id: 52, table: 'user_contrast_progress', operation: 'upsert', payload: { contrast_id: 'z' },
      status: 'pending', retryCount: 0, createdAt: new Date().toISOString(),
    }
    setupFlush([entry])
    mocks.mockSupabaseFrom.mockReturnValue({
      upsert: vi.fn().mockResolvedValue({
        error: { message: 'duplicate key value violates unique constraint', code: '23505' },
      }),
    })

    const result = await flushOutbox('user-1')

    expect(mocks.mockSyncOutboxUpdate).toHaveBeenCalledWith(52, expect.objectContaining({
      status: 'failed',
    }))
    expect(mocks.mockSyncOutboxDelete).not.toHaveBeenCalledWith(52)
    expect(result.failed).toBe(1)
    expect(result.synced).toBe(0)
  })
})
