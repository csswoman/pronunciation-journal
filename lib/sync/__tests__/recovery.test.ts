// @vitest-environment node
import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/lib/db'
import { reclaimStaleSyncingEntries, SYNCING_STALE_MS } from '../recovery'

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
})
