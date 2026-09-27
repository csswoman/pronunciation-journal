// @vitest-environment node
import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { from } = vi.hoisted(() => ({ from: vi.fn() }))

vi.mock('@/lib/supabase/client', () => ({
  getSupabaseBrowserClient: () => ({ from }),
}))

import { db } from '@/lib/db'
import { enqueue, flushOutbox } from '../sync-manager'
import { MAX_EXHAUSTED_RECOVERIES, recoverExhaustedEntries } from '../exhausted-recovery'
import type { SyncOutboxEntry } from '../types'

const USER = 'user-x'
const OTHER = 'user-y'
const HOUR = 60 * 60 * 1000

function networkDown() {
  from.mockImplementation(() => ({
    upsert: () => Promise.resolve({ error: { message: 'Failed to fetch' } }),
  }))
}

function networkUp() {
  from.mockImplementation(() => ({ upsert: () => Promise.resolve({ error: null }) }))
}

/** Runs three transient failures, clearing the per-retry backoff in between. */
async function exhaust(userId = USER): Promise<SyncOutboxEntry> {
  await enqueue(userId, 'activity_sessions', 'upsert', { id: `s-${userId}`, user_id: userId })
  networkDown()
  for (let i = 0; i < 3; i++) {
    await db.syncOutbox.toCollection().modify({ nextRetryAt: undefined })
    await flushOutbox(userId)
  }
  return (await db.syncOutbox.where('userId').equals(userId).first())!
}

function failedEntry(overrides: Partial<SyncOutboxEntry>): SyncOutboxEntry {
  return {
    userId: USER, table: 'activity_sessions', operation: 'upsert', payload: { id: 'x', user_id: USER },
    status: 'failed', createdAt: new Date().toISOString(), lastAttemptAt: new Date(0).toISOString(),
    retryCount: 3, ...overrides,
  }
}

beforeEach(async () => {
  db.close()
  await db.delete()
  await db.open()
  Object.defineProperty(globalThis, 'navigator', { value: { onLine: true }, configurable: true })
  from.mockReset()
})

afterEach(() => db.close())

describe('recoverExhaustedEntries', () => {
  it('marks three transient failures as exhausted, not permanent', async () => {
    const entry = await exhaust()
    expect(entry).toMatchObject({ status: 'failed', retryCount: 3, failureKind: 'exhausted' })
  })

  it('requeues after reconnection once the backoff elapsed, and syncs once', async () => {
    const entry = await exhaust()
    const lastAttempt = new Date(entry.lastAttemptAt!).getTime()

    expect((await recoverExhaustedEntries(USER, { now: lastAttempt + 1_000 })).requeued).toBe(0)
    expect((await recoverExhaustedEntries(USER, { now: lastAttempt + HOUR })).requeued).toBe(1)

    networkUp()
    await Promise.all([flushOutbox(USER), flushOutbox(USER)])
    expect(await db.syncOutbox.count()).toBe(0)
    expect(from).toHaveBeenCalledTimes(4)
  })

  it('never retries RLS, auth or invalid-payload failures', async () => {
    await db.syncOutbox.bulkAdd([
      failedEntry({ errorCode: '42501', failureKind: 'permanent', errorMessage: 'violates row-level security' }),
      failedEntry({ errorCode: 'PGRST301', failureKind: 'exhausted', errorMessage: 'JWT expired' }),
      failedEntry({ errorCode: '22P02', failureKind: 'permanent', errorMessage: 'invalid input syntax for type uuid' }),
      failedEntry({ errorMessage: 'violates check constraint' }),
    ])

    expect((await recoverExhaustedEntries(USER, { now: Date.now() })).requeued).toBe(0)
    expect((await db.syncOutbox.toArray()).every((entry) => entry.status === 'failed')).toBe(true)
  })

  it('recovers legacy uncoded network exhaustion but not other uncoded failures', async () => {
    await db.syncOutbox.bulkAdd([
      failedEntry({ errorMessage: 'TypeError: Failed to fetch' }),
      failedEntry({ errorMessage: 'something unknown' }),
    ])
    const result = await recoverExhaustedEntries(USER, { now: Date.now() })
    expect(result.requeued).toBe(1)
  })

  it('is scoped to the active user and bounded per entry', async () => {
    await exhaust(OTHER)
    const entry = await exhaust(USER)
    let now = new Date(entry.lastAttemptAt!).getTime()

    for (let round = 0; round < MAX_EXHAUSTED_RECOVERIES + 2; round++) {
      now += 24 * HOUR
      await recoverExhaustedEntries(USER, { now })
      const current = (await db.syncOutbox.where('userId').equals(USER).first())!
      if (current.status === 'pending') {
        await db.syncOutbox.update(current.id!, { status: 'failed', failureKind: 'exhausted', lastAttemptAt: new Date(now).toISOString() })
      }
    }

    expect((await db.syncOutbox.where('userId').equals(USER).first())?.recoveryCount).toBe(MAX_EXHAUSTED_RECOVERIES)
    expect((await db.syncOutbox.where('userId').equals(OTHER).first())?.recoveryCount).toBeUndefined()
  })
})
