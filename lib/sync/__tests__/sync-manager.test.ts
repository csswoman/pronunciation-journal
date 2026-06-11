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

  return {
    mockSyncOutboxAdd,
    mockSyncOutboxDelete,
    mockSyncOutboxUpdate,
    mockSyncOutboxModify,
    mockSyncOutboxWhere,
    mockDbTransaction,
    mockSupabaseFrom,
  }
})

// ── Mock @/lib/supabase/client ──────────────────────────────────────────────

vi.mock('@/lib/supabase/client', () => ({
  getSupabaseBrowserClient: () => ({ from: mocks.mockSupabaseFrom }),
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

  it('returns true for duplicate-key code 23505', () => {
    expect(isPermanentError('duplicate key value violates unique constraint', '23505')).toBe(true)
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
    await enqueue('user_contrast_progress', 'upsert', { contrast_id: 'x' }, { id: '1' })
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
    const id = await enqueue('answer_history', 'insert', { answer: 'yes' })
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
   *    for the first call (the pending query) and a modify-able chain for the second
   *    call (the stuck-syncing cleanup)
   */
  function setupFlush(pendingEntries: unknown[]) {
    let callCount = 0
    mocks.mockSyncOutboxWhere.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        // Compound index query: .between().limit().toArray()
        return {
          between: () => ({
            limit: () => ({
              toArray: () => Promise.resolve(pendingEntries),
            }),
          }),
          // Also provide anyOf for the ids.modify step (called in same transaction)
          anyOf: () => ({ modify: mocks.mockSyncOutboxModify }),
        }
      }
      if (callCount === 2) {
        // where('id').anyOf(ids).modify(...)
        return { anyOf: () => ({ modify: mocks.mockSyncOutboxModify }) }
      }
      // Stuck-syncing cleanup: where('status').equals('syncing').modify(...)
      return { equals: () => ({ modify: mocks.mockSyncOutboxModify }) }
    })

    mocks.mockDbTransaction.mockImplementation(
      async (_mode: string, _tables: unknown, fn: () => Promise<unknown>) => fn()
    )
  }

  it('deletes entry and increments synced count when Supabase succeeds', async () => {
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

    mocks.mockSupabaseFrom.mockReturnValue({
      upsert: vi.fn().mockResolvedValue({ error: null }),
    })

    const result = await flushOutbox()

    expect(mocks.mockSyncOutboxDelete).toHaveBeenCalledWith(1)
    expect(result.synced).toBe(1)
    expect(result.failed).toBe(0)
  })

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

    const result = await flushOutbox()

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

    const result = await flushOutbox()

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

    const result = await flushOutbox()

    expect(mocks.mockSyncOutboxUpdate).toHaveBeenCalledWith(4, expect.objectContaining({
      status: 'failed',
      retryCount: 3,
    }))
    expect(result.failed).toBe(1)
  })

  it('returns early with zeros when navigator.onLine is false', async () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: { onLine: false },
      writable: true,
      configurable: true,
    })

    const result = await flushOutbox()

    expect(result).toEqual({ synced: 0, failed: 0, skipped: 0 })
    expect(mocks.mockDbTransaction).not.toHaveBeenCalled()
  })

  it('returns zeros and does not call Supabase when outbox is empty', async () => {
    setupFlush([])

    const result = await flushOutbox()

    expect(result).toEqual({ synced: 0, failed: 0, skipped: 0 })
    expect(mocks.mockSupabaseFrom).not.toHaveBeenCalled()
  })
})
