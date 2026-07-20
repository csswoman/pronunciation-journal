// @vitest-environment node
import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/lib/db'
import {
  getNextRetryAt,
  isReadyToRetry,
  reclaimStaleSyncingEntries,
  SYNCING_STALE_MS,
} from '../recovery'

describe('sync retry boundaries', () => {
  const attemptedAt = '2026-07-18T12:00:00.000Z'

  it.each([
    [1, '2026-07-18T12:00:05.000Z'],
    [2, '2026-07-18T12:00:30.000Z'],
    [3, '2026-07-18T12:02:00.000Z'],
    [99, '2026-07-18T12:02:00.000Z'],
  ])('schedules retry %i with bounded backoff', (retryCount, expected) => {
    expect(getNextRetryAt(retryCount, attemptedAt)).toBe(expected)
  })

  it('becomes retryable exactly at nextRetryAt, but not one millisecond before', () => {
    const nextRetryAt = '2026-07-18T12:00:05.000Z'

    expect(isReadyToRetry(nextRetryAt, Date.parse(nextRetryAt) - 1)).toBe(false)
    expect(isReadyToRetry(nextRetryAt, Date.parse(nextRetryAt))).toBe(true)
    expect(isReadyToRetry(undefined, Date.parse(attemptedAt))).toBe(true)
  })
})

describe('reclaimStaleSyncingEntries', () => {
  beforeEach(async () => {
    db.close()
    await db.delete()
    await db.open()
  })

  afterEach(() => db.close())

  it('reclaims only syncing entries older than the staleness threshold', async () => {
    const currentTime = Date.parse('2026-07-18T12:00:00.000Z')
    await db.syncOutbox.bulkAdd([
      {
        table: 'answer_history', operation: 'upsert', payload: { id: 'stale' },
        status: 'syncing', createdAt: new Date(currentTime - 10_000).toISOString(),
        lastAttemptAt: new Date(currentTime - SYNCING_STALE_MS - 1).toISOString(), retryCount: 0,
      },
      {
        table: 'answer_history', operation: 'upsert', payload: { id: 'fresh' },
        status: 'syncing', createdAt: new Date(currentTime - 10_000).toISOString(),
        lastAttemptAt: new Date(currentTime - 10_000).toISOString(), retryCount: 0,
      },
    ])

    expect(await reclaimStaleSyncingEntries(currentTime)).toBe(1)
    expect((await db.syncOutbox.where('status').equals('pending').toArray()).map((entry) => entry.payload.id)).toEqual(['stale'])
    expect((await db.syncOutbox.where('status').equals('syncing').toArray()).map((entry) => entry.payload.id)).toEqual(['fresh'])
  })

  it('does not reclaim an entry exactly at the staleness threshold', async () => {
    const currentTime = Date.parse('2026-07-18T12:00:00.000Z')
    await db.syncOutbox.add({
      table: 'answer_history', operation: 'upsert', payload: { id: 'boundary' },
      status: 'syncing', createdAt: new Date(currentTime - SYNCING_STALE_MS).toISOString(),
      lastAttemptAt: new Date(currentTime - SYNCING_STALE_MS).toISOString(), retryCount: 0,
    })

    expect(await reclaimStaleSyncingEntries(currentTime)).toBe(0)
    expect((await db.syncOutbox.toArray())[0]?.status).toBe('syncing')
  })
})
