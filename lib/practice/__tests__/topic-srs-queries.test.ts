/**
 * Plan 061 step 3: rewritten alongside enqueueTopicSRSUpdate itself. The old
 * version of this test asserted implementation details of the now-removed
 * live-read + insert/update branching (see topic-srs-queries.race.test.ts's
 * header comment for the full rationale). This file now asserts the new
 * invariants: a local rating-event write + a single 'rpc' outbox enqueue,
 * regardless of whether the topic already has a row — the RPC now owns that
 * distinction entirely server-side.
 */
// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import 'fake-indexeddb/auto'

vi.mock('@/lib/sync/sync-manager', () => ({
  enqueue: vi.fn().mockResolvedValue(1),
}))

import { enqueue } from '@/lib/sync/sync-manager'
import { db } from '@/lib/db'
import { enqueueTopicSRSUpdate } from '@/lib/practice/topic-srs-queries'

const enqueueMock = vi.mocked(enqueue)

beforeEach(async () => {
  enqueueMock.mockClear()
  db.close()
  await db.delete()
  await db.open()
})

afterEach(() => db.close())

describe('enqueueTopicSRSUpdate', () => {
  it('enqueues an rpc call to apply_topic_srs_rating_event with the grade and topic', async () => {
    await enqueueTopicSRSUpdate('user-1', 'grammar:present simple', 5)

    expect(enqueueMock).toHaveBeenCalledTimes(1)
    const [table, op, payload, matchKey, onConflict, rpcName] = enqueueMock.mock.calls[0]
    expect(table).toBe('topic_srs')
    expect(op).toBe('rpc')
    expect(rpcName).toBe('apply_topic_srs_rating_event')
    expect(matchKey).toBeUndefined()
    expect(onConflict).toBeUndefined()
    expect(payload).toMatchObject({
      p_user_id: 'user-1',
      p_topic: 'grammar:present simple',
      p_grade: 5,
    })
  })

  it('writes a local pending rating-event row alongside the enqueue', async () => {
    await enqueueTopicSRSUpdate('user-1', 'grammar:present simple', 1)

    const events = await db.srsRatingEvents.where('userId').equals('user-1').toArray()
    expect(events).toHaveLength(1)
    expect(events[0]).toMatchObject({
      entityType: 'topic_srs',
      topic: 'grammar:present simple',
      grade: 1,
      status: 'pending',
    })
  })
})
