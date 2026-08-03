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
    const [userId, table, op, payload, matchKey, onConflict, rpcName] = enqueueMock.mock.calls[0]
    expect(userId).toBe('user-1')
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

  it('canonicalizes accepted aliases before writing', async () => {
    await enqueueTopicSRSUpdate('user-1', 'grammar:present_simple_s', 2)

    const payload = enqueueMock.mock.calls[0][3] as Record<string, unknown>
    expect(payload.p_topic).toBe('grammar:present simple')
    const events = await db.srsRatingEvents.where('userId').equals('user-1').toArray()
    expect(events[0]?.topic).toBe('grammar:present simple')
  })

  it('rejects bare topics and unknown catalog ids before touching the outbox', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    await expect(enqueueTopicSRSUpdate('user-1', 'past_simple', 2)).resolves.toBeNull()
    await expect(enqueueTopicSRSUpdate('user-1', 'grammar:not-in-catalog', 2)).resolves.toBeNull()

    expect(enqueueMock).not.toHaveBeenCalled()
    expect(await db.srsRatingEvents.where('userId').equals('user-1').toArray()).toEqual([])
    expect(warn).toHaveBeenCalledTimes(2)
    warn.mockRestore()
  })

  it('supports a server writer without importing the browser outbox', async () => {
    const write = vi.fn().mockResolvedValue({ next_review_at: '2026-01-01T00:00:00.000Z' })

    const result = await enqueueTopicSRSUpdate('user-1', 'grammar:articles', 2, { write })

    expect(result).toMatchObject({ topic: 'grammar:articles', result: { next_review_at: '2026-01-01T00:00:00.000Z' } })
    expect(write).toHaveBeenCalledWith(expect.objectContaining({
      topic: 'grammar:articles',
      rpcArgs: expect.objectContaining({ p_topic: 'grammar:articles', p_grade: 2 }),
    }))
    expect(enqueueMock).not.toHaveBeenCalled()
  })
})
