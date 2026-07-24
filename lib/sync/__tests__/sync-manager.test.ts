/* eslint-disable max-lines -- Cohesive integration-oriented sync-manager suite. */

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

import * as SyncManager from '../sync-manager'
const { isPermanentError, enqueue, flushOutbox } = SyncManager

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

  it('throws when operation is rpc but rpcName is omitted', async () => {
    await expect(
      enqueue('user-1', 'word_bank', 'rpc', { p_word_id: 'w1' })
    ).rejects.toThrow('rpc operation requires rpcName')
    expect(mocks.mockSyncOutboxAdd).not.toHaveBeenCalled()
  })

  it('throws when userId is empty', async () => {
    await expect(
      enqueue('', 'answer_history', 'insert', { answer: 'yes' })
    ).rejects.toThrow('requires an explicit user_id')
  })
})

it('rejects an RPC entry without its function name', async () => {
  vi.clearAllMocks()
  await expect(enqueue('user-1', 'word_bank', 'rpc', {})).rejects.toThrow('rpc operation requires rpcName')
  expect(mocks.mockSyncOutboxAdd).not.toHaveBeenCalled()
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

  it('performs a delete operation using matchKey columns as eq filters', async () => {
    const eq = vi.fn()
    const deleteQuery: { eq: typeof eq } = { eq }
    eq.mockImplementation(() => deleteQuery)
    const del = vi.fn().mockReturnValue(deleteQuery)
    // Final .eq() call must resolve like a thenable query result.
    eq.mockImplementation(() => Promise.resolve({ error: null }))

    const entry = {
      id: 14,
      table: 'journal_entries',
      operation: 'delete',
      payload: {},
      matchKey: { id: 'entry-1' },
      status: 'pending',
      retryCount: 0,
      createdAt: new Date().toISOString(),
    }

    setupFlush([entry])
    mocks.mockSupabaseFrom.mockReturnValue({ delete: del })

    const result = await flushOutbox('user-1')

    expect(del).toHaveBeenCalled()
    expect(eq).toHaveBeenCalledWith('id', 'entry-1')
    expect(mocks.mockSyncOutboxDelete).toHaveBeenCalledWith(14)
    expect(result.synced).toBe(1)
  })

  it('performs an update operation using matchKey columns as eq filters', async () => {
    const eq = vi.fn().mockImplementation(() => Promise.resolve({ error: null }))
    const update = vi.fn().mockReturnValue({ eq })

    const entry = {
      id: 15,
      table: 'journal_entries',
      operation: 'update',
      payload: { title: 'updated' },
      matchKey: { id: 'entry-2' },
      status: 'pending',
      retryCount: 0,
      createdAt: new Date().toISOString(),
    }

    setupFlush([entry])
    mocks.mockSupabaseFrom.mockReturnValue({ update })

    const result = await flushOutbox('user-1')

    expect(update).toHaveBeenCalledWith({ title: 'updated' })
    expect(eq).toHaveBeenCalledWith('id', 'entry-2')
    expect(mocks.mockSyncOutboxDelete).toHaveBeenCalledWith(15)
    expect(result.synced).toBe(1)
  })
})

// Failure / edge-outcome tests live in sync-manager.flush-outcomes.test.ts.
// Per-entity ordering and 23505 reclassification tests live in
// sync-manager.ordering.test.ts.
// ── D. resolveOnConflict ───────────────────────────────────────────────────

describe('resolveOnConflict', () => {
  it('returns entry.onConflict when explicitly provided', () => {
    const entry = {
      table: 'user_contrast_progress',
      onConflict: 'custom_conflict_key',
    }
    expect(SyncManager.resolveOnConflict(entry as never)).toBe('custom_conflict_key')
  })

  it('returns UPSERT_CONFLICT_COLUMNS value for known tables', () => {
    const entry1 = { table: 'answer_history' }
    expect(SyncManager.resolveOnConflict(entry1 as never)).toBe('id')

    const entry2 = { table: 'user_learning_state' }
    expect(SyncManager.resolveOnConflict(entry2 as never)).toBe('user_id')

    const entry3 = { table: 'lesson_completions' }
    expect(SyncManager.resolveOnConflict(entry3 as never)).toBe('user_id,course_slug,lesson_slug')
  })

  it('returns undefined for unknown tables without explicit onConflict', () => {
    const entry = { table: 'unknown_table' }
    expect(SyncManager.resolveOnConflict(entry as never)).toBeUndefined()
  })
})

// ── E. classifyUniqueViolationAsIdempotentSuccess ─────────────────────────

describe('classifyUniqueViolationAsIdempotentSuccess', () => {
  it('returns true for rpc operation with p_idempotency_key', () => {
    const entry = {
      operation: 'rpc',
      rpcName: 'apply_word_bank_rating_event',
      payload: { p_idempotency_key: 'some-uuid-value' },
    }
    expect(SyncManager.classifyUniqueViolationAsIdempotentSuccess(entry as never)).toBe(true)
  })

  it('returns true for rpc operation with non-empty p_idempotency_key string', () => {
    const entry = {
      operation: 'rpc',
      payload: { p_idempotency_key: 'abc-123' },
    }
    expect(SyncManager.classifyUniqueViolationAsIdempotentSuccess(entry as never)).toBe(true)
  })

  it('returns false for rpc operation without p_idempotency_key', () => {
    const entry = {
      operation: 'rpc',
      payload: { p_word_id: 'word-1' },
    }
    expect(SyncManager.classifyUniqueViolationAsIdempotentSuccess(entry as never)).toBe(false)
  })

  it('returns false for rpc operation with empty p_idempotency_key', () => {
    const entry = {
      operation: 'rpc',
      payload: { p_idempotency_key: '' },
    }
    expect(SyncManager.classifyUniqueViolationAsIdempotentSuccess(entry as never)).toBe(false)
  })

  it('returns false for non-rpc operations', () => {
    const entry = {
      operation: 'upsert',
      payload: { id: 'test-id' },
    }
    expect(SyncManager.classifyUniqueViolationAsIdempotentSuccess(entry as never)).toBe(false)
  })

  it('returns true for a plain insert on pronunciation_assessments with a client-generated id', () => {
    const entry = {
      operation: 'insert',
      table: 'pronunciation_assessments',
      payload: { id: 'assessment-uuid-1', user_id: 'user-1' },
    }
    expect(SyncManager.classifyUniqueViolationAsIdempotentSuccess(entry as never)).toBe(true)
  })

  it('returns false for a plain insert on pronunciation_assessments without an id', () => {
    const entry = {
      operation: 'insert',
      table: 'pronunciation_assessments',
      payload: { user_id: 'user-1' },
    }
    expect(SyncManager.classifyUniqueViolationAsIdempotentSuccess(entry as never)).toBe(false)
  })

  it('returns false for a plain insert on a table NOT in the client-generated-id allowlist', () => {
    const entry = {
      operation: 'insert',
      table: 'answer_history',
      payload: { id: 'row-1' },
    }
    expect(SyncManager.classifyUniqueViolationAsIdempotentSuccess(entry as never)).toBe(false)
  })

  it('returns false for an upsert on pronunciation_assessments even with an id (allowlist is insert-only)', () => {
    const entry = {
      operation: 'upsert',
      table: 'pronunciation_assessments',
      payload: { id: 'assessment-uuid-1' },
    }
    expect(SyncManager.classifyUniqueViolationAsIdempotentSuccess(entry as never)).toBe(false)
  })
})

// ── F. entityKeyFor ────────────────────────────────────────────────────────

describe('entityKeyFor', () => {
  it('returns rpc-based key for rpc operations with p_word_id', () => {
    const entry = {
      id: 1,
      operation: 'rpc',
      rpcName: 'apply_word_bank_rating_event',
      payload: { p_word_id: 'word-123' },
    }
    expect(SyncManager.entityKeyFor(entry as never)).toBe('rpc:apply_word_bank_rating_event:word-123')
  })

  it('returns rpc-based key for rpc operations with p_user_id and p_topic', () => {
    const entry = {
      id: 2,
      operation: 'rpc',
      rpcName: 'apply_topic_srs_rating_event',
      payload: { p_user_id: 'user-1', p_topic: 'phonetics' },
    }
    expect(SyncManager.entityKeyFor(entry as never)).toBe('rpc:apply_topic_srs_rating_event:user-1:phonetics')
  })

  it('returns matchKey-based key for operations with matchKey', () => {
    const entry = {
      id: 3,
      table: 'user_contrast_progress',
      operation: 'update',
      matchKey: { user_id: 'user-1', contrast_id: 'contrast-a' },
    }
    expect(SyncManager.entityKeyFor(entry as never)).toBe('user_contrast_progress:contrast_id=contrast-a,user_id=user-1')
  })

  it('returns onConflict-based key for upsert with resolved onConflict columns', () => {
    const entry = {
      id: 4,
      table: 'answer_history',
      operation: 'upsert',
      payload: { id: 'answer-1', user_id: 'user-1' },
    }
    expect(SyncManager.entityKeyFor(entry as never)).toBe('answer_history:id=answer-1')
  })

  it('returns entry:id for operations with no derivable identity', () => {
    const entry = {
      id: 5,
      table: 'some_table',
      operation: 'insert',
      payload: { data: 'test' },
    }
    expect(SyncManager.entityKeyFor(entry as never)).toBe('entry:5')
  })
})

// ── G. emptyFlushResult ────────────────────────────────────────────────────

describe('emptyFlushResult', () => {
  it('returns a result with zero counts and empty operations array', () => {
    const result = SyncManager.emptyFlushResult()
    expect(result).toEqual({ synced: 0, failed: 0, skipped: 0, operations: [] })
  })
})

// ── H. summarize ───────────────────────────────────────────────────────────

describe('summarize', () => {
  it('correctly counts synced, failed, and skipped operations', () => {
    const operations = [
      { id: 1, table: 'a', operation: 'upsert', outcome: 'synced' },
      { id: 2, table: 'b', operation: 'insert', outcome: 'failed', errorMessage: 'error' },
      { id: 3, table: 'c', operation: 'delete', outcome: 'skipped' },
      { id: 4, table: 'd', operation: 'upsert', outcome: 'synced' },
    ]
    const result = SyncManager.summarize(operations as never)
    expect(result).toEqual({
      synced: 2,
      failed: 1,
      skipped: 1,
      operations: operations as never,
    })
  })

  it('returns zero counts for empty operations array', () => {
    const result = SyncManager.summarize([] as never)
    expect(result).toEqual({ synced: 0, failed: 0, skipped: 0, operations: [] })
  })
})
