// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Hoist mock references so vi.mock factories can access them ──────────────

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

// ── Mock @/lib/supabase/client ──────────────────────────────────────────────

vi.mock('@/lib/supabase/client', () => ({
  getSupabaseBrowserClient: () => ({ from: mocks.mockSupabaseFrom, rpc: mocks.mockSupabaseRpc }),
}))

// ── Mock @/lib/db ───────────────────────────────────────────────────────────

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
}))

// Mock Dexie static (used for Dexie.minKey / Dexie.maxKey)
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

// ── Import subject AFTER mocks ──────────────────────────────────────────────

import { isPermanentError, enqueue, flushOutbox } from '../sync-manager'

// ── A. isPermanentError ─────────────────────────────────────────────────────

describe('isPermanentError', () => {
  it('returns true for RLS violation code 42501', () => {
    expect(isPermanentError('permission denied', '42501')).toBe(true)
  })

  it('returns true for check-constraint code 23514', () => {
    expect(isPermanentError('violates check constraint', '23514')).toBe(true)
  })

  it('returns true for foreign-key code 23503', () => {
    expect(isPermanentError('insert or update violates foreign key constraint', '23503')).toBe(true)
  })

  it('does NOT classify duplicate-key code 23505 as permanent on its own — flushOutboxInternal decides that per-entry via classifyUniqueViolationAsIdempotentSuccess', () => {
    expect(isPermanentError('duplicate key value violates unique constraint', '23505')).toBe(false)
  })

  it('returns true for message containing "violates row-level security" without a code', () => {
    expect(isPermanentError('new row violates row-level security policy', undefined)).toBe(true)
  })

  it('returns false for a transient network-style error', () => {
    expect(isPermanentError('fetch failed', undefined)).toBe(false)
  })

  it('returns false for an empty message with no code', () => {
    expect(isPermanentError('', undefined)).toBe(false)
  })
})

// ── B. enqueue ──────────────────────────────────────────────────────────────

describe('enqueue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.mockSyncOutboxAdd.mockResolvedValue(1)
  })

  it('calls db.syncOutbox.add with status:pending, retryCount:0, and a valid ISO createdAt', async () => {
    const before = new Date()
    await enqueue('user-1', 'user_contrast_progress', 'upsert', { contrast_id: 'x' }, { id: '1' })
    const after = new Date()

    expect(mocks.mockSyncOutboxAdd).toHaveBeenCalledOnce()
    const arg = mocks.mockSyncOutboxAdd.mock.calls[0][0]

    expect(arg.table).toBe('user_contrast_progress')
    expect(arg.operation).toBe('upsert')
    expect(arg.payload).toEqual({ contrast_id: 'x' })
    expect(arg.matchKey).toEqual({ id: '1' })
    expect(arg.status).toBe('pending')
    expect(arg.retryCount).toBe(0)

    const ts = new Date(arg.createdAt)
    expect(ts.getTime()).toBeGreaterThanOrEqual(before.getTime())
    expect(ts.getTime()).toBeLessThanOrEqual(after.getTime())
  })

  it('returns the id produced by db.syncOutbox.add', async () => {
    mocks.mockSyncOutboxAdd.mockResolvedValue(42)
    const id = await enqueue('user-1', 'answer_history', 'insert', { answer: 'yes' })
    expect(id).toBe(42)
  })
})

// ── C. flushOutbox ──────────────────────────────────────────────────────────

describe('flushOutbox', () => {
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

  /**
   * Set up mockDbTransaction so that:
   *  - it executes the callback (simulating the Dexie transaction)
   *  - db.syncOutbox.where() returns a chain whose toArray() yields `pendingEntries`
   *    for the pending query, then chains the batch-scoped cleanup.
   */
  function setupFlush(pendingEntries: unknown[]) {
    let callCount = 0
    mocks.mockSyncOutboxWhere.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        // Compound index query: .between().limit().toArray()
        return {
          between: () => ({
            toArray: () => Promise.resolve(pendingEntries),
          }),
          // Also provide anyOf for the ids.modify step (called in same transaction)
          anyOf: () => ({ modify: mocks.mockSyncOutboxModify }),
        }
      }
      if (callCount === 2) {
        // where('id').anyOf(ids).modify(...)
        return { anyOf: () => ({ modify: mocks.mockSyncOutboxModify }) }
      }
      // Batch-scoped cleanup: where('id').anyOf(ids).filter(...).modify(...)
      return { anyOf: () => ({ filter: () => ({ modify: mocks.mockSyncOutboxModify }) }) }
    })

    mocks.mockDbTransaction.mockImplementation(
      async (_mode: string, _tables: unknown, fn: () => Promise<unknown>) => fn()
    )
  }

  it('deletes entry and increments synced count when Supabase succeeds', async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null })
    const entry = {
      id: 1,
      table: 'user_contrast_progress',
      operation: 'upsert',
      payload: { contrast_id: 'x' },
      status: 'pending',
      retryCount: 0,
      createdAt: new Date().toISOString(),
    }

    setupFlush([entry])

    mocks.mockSupabaseFrom.mockReturnValue({ upsert })

    const result = await flushOutbox('user-1')

    expect(upsert).toHaveBeenCalledWith(
      { contrast_id: 'x' },
      { onConflict: 'user_id,contrast_id' },
    )
    expect(mocks.mockSyncOutboxDelete).toHaveBeenCalledWith(1)
    expect(result.synced).toBe(1)
    expect(result.failed).toBe(0)
  })

  it('uses the explicit onConflict from the queued entry when provided', async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null })
    const entry = {
      id: 11,
      table: 'user_contrast_progress',
      operation: 'upsert',
      payload: { contrast_id: 'x' },
      onConflict: 'id',
      status: 'pending',
      retryCount: 0,
      createdAt: new Date().toISOString(),
    }

    setupFlush([entry])
    mocks.mockSupabaseFrom.mockReturnValue({ upsert })

    await flushOutbox('user-1')

    expect(upsert).toHaveBeenCalledWith(
      { contrast_id: 'x' },
      { onConflict: 'id' },
    )
  })

  it('derives onConflict for user_learning_state when the producer omitted it', async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null })
    const entry = {
      id: 12,
      table: 'user_learning_state',
      operation: 'upsert',
      payload: { user_id: 'u1', state: { foo: 'bar' } },
      status: 'pending',
      retryCount: 0,
      createdAt: new Date().toISOString(),
    }

    setupFlush([entry])
    mocks.mockSupabaseFrom.mockReturnValue({ upsert })

    await flushOutbox('user-1')

    expect(upsert).toHaveBeenCalledWith(
      { user_id: 'u1', state: { foo: 'bar' } },
      { onConflict: 'user_id' },
    )
  })

  it('uses an id conflict target for idempotent answer-history writes', async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null })
    const entry = {
      id: 13,
      table: 'answer_history',
      operation: 'upsert',
      payload: { id: 'answer-1' },
      status: 'pending',
      retryCount: 0,
      createdAt: new Date().toISOString(),
    }
    setupFlush([entry])
    mocks.mockSupabaseFrom.mockReturnValue({ upsert })

    await flushOutbox('user-1')

    expect(upsert).toHaveBeenCalledWith({ id: 'answer-1' }, { onConflict: 'id' })
  })

})

// Failure / edge-outcome tests live in sync-manager.flush-outcomes.test.ts.
// Per-entity ordering and 23505 reclassification tests live in
// sync-manager.ordering.test.ts.
