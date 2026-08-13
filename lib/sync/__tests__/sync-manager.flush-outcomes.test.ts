/**
 * flushOutbox failure / edge-outcome tests.
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
    return { anyOf: () => ({ filter: (pred: (e: unknown) => boolean) => ({ modify: mocks.mockSyncOutboxModify, __ran: pendingEntries.map(pred) }) }) }
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

describe('flushOutbox failure outcomes', () => {
  it('increments retryCount and keeps status pending on a transient error', async () => {
    const entry = {
      id: 2,
      table: 'answer_history',
      operation: 'insert',
      payload: { answer: 'yes' },
      status: 'pending',
      retryCount: 0,
      createdAt: new Date().toISOString(),
    }

    setupFlush([entry])

    mocks.mockSupabaseFrom.mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: { message: 'fetch failed', code: undefined } }),
    })

    const result = await flushOutbox('user-1')

    expect(mocks.mockSyncOutboxUpdate).toHaveBeenCalledWith(2, expect.objectContaining({
      status: 'pending',
      retryCount: 1,
    }))
    expect(result.failed).toBe(1)
    expect(result.synced).toBe(0)
  })

  it('marks entry failed on a permanent RLS error (code 42501)', async () => {
    const entry = {
      id: 3,
      table: 'user_contrast_progress',
      operation: 'upsert',
      payload: { contrast_id: 'z' },
      status: 'pending',
      retryCount: 0,
      createdAt: new Date().toISOString(),
    }

    setupFlush([entry])

    mocks.mockSupabaseFrom.mockReturnValue({
      upsert: vi.fn().mockResolvedValue({
        error: { message: 'new row violates row-level security policy', code: '42501' },
      }),
    })

    const result = await flushOutbox('user-1')

    expect(mocks.mockSyncOutboxUpdate).toHaveBeenCalledWith(3, expect.objectContaining({
      status: 'failed',
    }))
    expect(result.failed).toBe(1)
  })

  it('marks entry failed when retryCount reaches MAX_RETRIES (3)', async () => {
    const entry = {
      id: 4,
      table: 'answer_history',
      operation: 'insert',
      payload: { answer: 'no' },
      status: 'pending',
      retryCount: 2, // retryCount + 1 = 3 = MAX_RETRIES → permanent
      createdAt: new Date().toISOString(),
    }

    setupFlush([entry])

    mocks.mockSupabaseFrom.mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: { message: 'timeout', code: undefined } }),
    })

    const result = await flushOutbox('user-1')

    expect(mocks.mockSyncOutboxUpdate).toHaveBeenCalledWith(4, expect.objectContaining({
      status: 'failed',
      retryCount: 3,
    }))
    expect(result.failed).toBe(1)
  })

  it('isolates success, transient failure, and permanent failure within one batch', async () => {
    const entries = [
      {
        id: 21, table: 'answer_history', operation: 'upsert', payload: { id: 'ok' },
        status: 'pending', retryCount: 0, createdAt: new Date().toISOString(),
      },
      {
        id: 22, table: 'activity_sessions', operation: 'upsert', payload: { id: 'retry' },
        status: 'pending', retryCount: 0, createdAt: new Date().toISOString(),
      },
      {
        id: 23, table: 'word_bank', operation: 'upsert', payload: { id: 'rejected' },
        status: 'pending', retryCount: 0, createdAt: new Date().toISOString(),
      },
    ]
    setupFlush(entries)
    mocks.mockSupabaseFrom.mockImplementation((table: string) => ({
      upsert: vi.fn().mockResolvedValue(
        table === 'answer_history'
          ? { error: null }
          : table === 'activity_sessions'
            ? { error: { message: 'fetch failed', code: undefined } }
            : { error: { message: 'permission denied', code: '42501' } },
      ),
    }))

    const result = await flushOutbox('user-1')

    expect(mocks.mockSyncOutboxDelete).toHaveBeenCalledWith(21)
    expect(mocks.mockSyncOutboxUpdate).toHaveBeenCalledWith(22, expect.objectContaining({
      status: 'pending', retryCount: 1, nextRetryAt: expect.any(String),
    }))
    expect(mocks.mockSyncOutboxUpdate).toHaveBeenCalledWith(23, expect.objectContaining({
      status: 'failed', retryCount: 1,
    }))
    expect(result.synced).toBe(1)
    expect(result.failed).toBe(2)
    expect(result.skipped).toBe(0)
    expect(result.operations).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 21, outcome: 'synced' }),
      expect.objectContaining({ id: 22, outcome: 'failed', errorMessage: 'fetch failed' }),
      expect.objectContaining({ id: 23, outcome: 'failed', errorMessage: 'permission denied' }),
    ]))
    expect(result.operations).toHaveLength(3)
  })

  it('returns early with zeros when navigator.onLine is false', async () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: { onLine: false },
      writable: true,
      configurable: true,
    })

    const result = await flushOutbox('user-1')

    expect(result).toEqual({ synced: 0, failed: 0, skipped: 0, operations: [] })
    expect(mocks.mockDbTransaction).not.toHaveBeenCalled()
  })

  it('returns zeros and does not call Supabase when outbox is empty', async () => {
    setupFlush([])

    const result = await flushOutbox('user-1')

    expect(result).toEqual({ synced: 0, failed: 0, skipped: 0, operations: [] })
    expect(mocks.mockSupabaseFrom).not.toHaveBeenCalled()
  })

  it('marks a claimed entry as skipped and resets it to pending when it is never resolved (safety net)', async () => {
    // Simulate an entry that was claimed (pending -> syncing) but whose
    // processing never produced an outcome — e.g. a bug that throws outside
    // processEntry's own try/catch. We reproduce that by making the
    // failure-path db.syncOutbox.update call itself reject, so processEntry's
    // catch block never gets to push a 'failed' outcome, leaving the entry
    // "stuck" for the safety-net sweep at the end of flushOutboxInternal.
    const entry = {
      id: 99,
      table: 'answer_history',
      operation: 'insert',
      payload: { answer: 'stuck' },
      status: 'pending',
      retryCount: 0,
      createdAt: new Date().toISOString(),
    }

    setupFlush([entry])

    mocks.mockSupabaseFrom.mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: { message: 'boom', code: undefined } }),
    })
    mocks.mockSyncOutboxUpdate.mockImplementation((id: number) => {
      if (id === 99) return Promise.reject(new Error('update failed'))
      return Promise.resolve(1)
    })

    const result = await flushOutbox('user-1')

    expect(result.skipped).toBe(1)
    expect(result.operations).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 99, outcome: 'skipped' }),
    ]))
  })
})
