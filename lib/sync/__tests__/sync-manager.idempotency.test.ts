/**
 * Characterization tests for the outbox's idempotency, offline-retry, and
 * permanent-error handling (plan 061 step 1).
 *
 * Uses fake-indexeddb + the real Dexie `db`, mirroring the style of
 * lib/sync/__tests__/recovery.test.ts and
 * lib/sync/__tests__/sync-manager.concurrency.test.ts, so entries actually
 * persist across "reload" (re-opening the db) rather than through mocked
 * Dexie calls.
 */
// @vitest-environment node
import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { from } = vi.hoisted(() => ({ from: vi.fn() }))

vi.mock('@/lib/supabase/client', () => ({
  getSupabaseBrowserClient: () => ({ from }),
}))

import { db } from '@/lib/db'
import { enqueue, flushOutbox } from '../sync-manager'

describe('outbox retry-after-reload and duplicate-idempotency-key characterization', () => {
  beforeEach(async () => {
    db.close()
    await db.delete()
    await db.open()
    Object.defineProperty(globalThis, 'navigator', { value: { onLine: true }, configurable: true })
    from.mockReset()
  })

  afterEach(() => db.close())

  it('BASELINE: a pending outbox entry survives a reload (re-open) and remains eligible for flush', async () => {
    await enqueue(
      'user-1',
      'topic_srs',
      'update',
      { review_count: 5, user_id: 'user-1' },
      { id: 'row-1', user_id: 'user-1' },
    )

    // Simulate app reload: close and reopen the same underlying IndexedDB.
    db.close()
    await db.open()

    const pending = await db.syncOutbox.where('status').equals('pending').toArray()
    expect(pending).toHaveLength(1)
    expect(pending[0].table).toBe('topic_srs')
    expect(pending[0].payload).toMatchObject({ review_count: 5 })

    // And it is actually eligible for flush post-reload.
    from.mockReturnValue({
      update: vi.fn(() => ({ eq: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) })) })),
    })
    const result = await flushOutbox('user-1')
    expect(result.synced).toBe(1)
    expect(await db.syncOutbox.count()).toBe(0)
  })

  it('BUG: submitting the same logical update twice (same matchKey/payload) through the outbox applies it twice to Supabase — no dedup by matchKey today', async () => {
    // Two outbox entries, same logical operation (e.g. a retried enqueue
    // after a UI double-submit, or a re-derived duplicate from two overlapping
    // callers), share the same table/matchKey/payload shape.
    await enqueue(
      'user-1',
      'topic_srs',
      'update',
      { review_count: 5, user_id: 'user-1' },
      { id: 'row-1', user_id: 'user-1' },
    )
    await enqueue(
      'user-1',
      'topic_srs',
      'update',
      { review_count: 5, user_id: 'user-1' },
      { id: 'row-1', user_id: 'user-1' },
    )

    const updateCalls: unknown[] = []
    from.mockReturnValue({
      update: vi.fn((payload: unknown) => {
        updateCalls.push(payload)
        return { eq: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) })) }
      }),
    })

    const result = await flushOutbox('user-1')

    // Today: both entries are distinct outbox rows with no shared idempotency
    // key, so both get sent to Supabase as two separate `.update()` calls —
    // the duplicate is applied twice instead of being recognized as a retry
    // of the same logical operation.
    expect(updateCalls).toHaveLength(2)
    expect(result.synced).toBe(2)
  })

  it('BASELINE: a permanent Supabase error (RLS, code 42501) marks the entry failed and does not retry', async () => {
    await enqueue(
      'user-1',
      'topic_srs',
      'update',
      { review_count: 5, user_id: 'user-1' },
      { id: 'row-1', user_id: 'user-1' },
    )

    from.mockReturnValue({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({
            error: { message: 'new row violates row-level security policy', code: '42501' },
          }),
        })),
      })),
    })

    const result = await flushOutbox('user-1')

    expect(result.failed).toBe(1)
    expect(result.synced).toBe(0)
    const entries = await db.syncOutbox.toArray()
    expect(entries).toHaveLength(1)
    expect(entries[0].status).toBe('failed')
    expect(entries[0].retryCount).toBe(1)

    // A subsequent flush must NOT re-attempt a failed entry.
    const secondResult = await flushOutbox('user-1')
    expect(secondResult).toEqual({ synced: 0, failed: 0, skipped: 0, operations: [] })
  })

  it('BASELINE: a permanent Supabase error (duplicate key, code 23505) marks the entry failed and does not retry', async () => {
    await enqueue(
      'user-1',
      'topic_srs',
      'insert',
      { user_id: 'user-1', topic: 'grammar:present simple', review_count: 1 },
    )

    from.mockReturnValue({
      insert: vi.fn().mockResolvedValue({
        error: { message: 'duplicate key value violates unique constraint', code: '23505' },
      }),
    })

    const result = await flushOutbox('user-1')

    expect(result.failed).toBe(1)
    const entries = await db.syncOutbox.toArray()
    expect(entries[0].status).toBe('failed')
  })
})
