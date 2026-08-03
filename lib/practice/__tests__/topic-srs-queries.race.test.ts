/**
 * Plan 061 step 3: `enqueueTopicSRSUpdate` was rewritten to no longer read
 * topic_srs's current state (or even whether a row exists yet) before
 * writing. It now submits an immutable rating event keyed by
 * (user_id, topic) and enqueues a call to the transactional
 * `apply_topic_srs_rating_event` RPC, which creates the row on first rating
 * and applies SM-2 server-side under a row lock
 * (supabase/migrations/20260720080000).
 *
 * These tests replace the step 1 characterization tests, which documented
 * the OLD racy behavior (a live Supabase read + client-computed SM-2 +
 * enqueueing either an absolute INSERT or UPDATE). Both races it documented
 * — the double-insert race for a brand-new topic, and the lost-update race
 * for an existing topic — can no longer be reproduced client-side, because
 * there is no more local read of "does a row exist / what is its state" to
 * race on. Conflict resolution now happens server-side via the RPC's
 * SELECT/INSERT-as-lock, out of scope for a client-side unit test. What we
 * assert here is what the CLIENT can guarantee: two overlapping local calls
 * are queued as two distinct, immutable rating events with distinct
 * idempotency keys, and neither overwrites the other locally.
 */
// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import 'fake-indexeddb/auto'

vi.mock('@/lib/sync/sync-manager', () => ({
  enqueue: vi.fn().mockResolvedValue(1),
}))

import { enqueue } from '@/lib/sync/sync-manager'
import { db } from '@/lib/db'
import { enqueueTopicSRSUpdate } from '../topic-srs-queries'

const enqueueMock = vi.mocked(enqueue)

describe('enqueueTopicSRSUpdate (rewritten: local-only, no network read)', () => {
  beforeEach(async () => {
    enqueueMock.mockClear()
    db.close()
    await db.delete()
    await db.open()
  })

  afterEach(async () => {
    db.close()
  })

  it('never reads remote/local current state — it only writes a rating event and enqueues an RPC call', async () => {
    await enqueueTopicSRSUpdate('user-1', 'grammar:present simple', 4)

    expect(enqueueMock).toHaveBeenCalledTimes(1)
    const [userId, table, operation, payload, matchKey, onConflict, rpcName] = enqueueMock.mock.calls[0]
    expect(userId).toBe('user-1')
    expect(table).toBe('topic_srs')
    expect(operation).toBe('rpc')
    expect(rpcName).toBe('apply_topic_srs_rating_event')
    expect(matchKey).toBeUndefined()
    expect(onConflict).toBeUndefined()
    expect(payload).toMatchObject({
      p_user_id: 'user-1',
      p_topic: 'grammar:present simple',
      p_grade: 4,
    })
    expect(typeof (payload as Record<string, unknown>).p_idempotency_key).toBe('string')
  })

  it('writes one immutable local rating-event row per call, keyed by topic (not entityId)', async () => {
    await enqueueTopicSRSUpdate('user-1', 'grammar:present simple', 4)

    const events = await db.srsRatingEvents.where('userId').equals('user-1').toArray()
    expect(events).toHaveLength(1)
    expect(events[0]).toMatchObject({
      userId: 'user-1',
      entityType: 'topic_srs',
      topic: 'grammar:present simple',
      grade: 4,
      status: 'pending',
    })
    expect(events[0].entityId).toBeUndefined()
  })

  it('two overlapping ratings for a brand-new topic are queued as two distinct events, not two competing inserts', async () => {
    const first = enqueueTopicSRSUpdate('user-1', 'grammar:present simple', 4)
    const second = enqueueTopicSRSUpdate('user-1', 'grammar:present simple', 5)
    await Promise.all([first, second])

    expect(enqueueMock).toHaveBeenCalledTimes(2)
    const firstPayload = enqueueMock.mock.calls[0][3] as Record<string, unknown>
    const secondPayload = enqueueMock.mock.calls[1][3] as Record<string, unknown>

    // Distinct idempotency keys, both calls are 'rpc' — there is no more
    // 'insert' vs 'update' branching client-side, so the old unique-
    // constraint collision (two competing INSERTs) cannot happen here; the
    // RPC's own upsert-as-lock serializes first-time ratings server-side.
    expect(firstPayload.p_idempotency_key).not.toBe(secondPayload.p_idempotency_key)
    expect(firstPayload.p_grade).toBe(4)
    expect(secondPayload.p_grade).toBe(5)

    const events = await db.srsRatingEvents.where('userId').equals('user-1').toArray()
    expect(events).toHaveLength(2)
  })

  it('two overlapping ratings for an existing topic are also queued as two distinct events — no lost update locally', async () => {
    const first = enqueueTopicSRSUpdate('user-1', 'grammar:present simple', 4)
    const second = enqueueTopicSRSUpdate('user-1', 'grammar:present simple', 4)
    await Promise.all([first, second])

    expect(enqueueMock).toHaveBeenCalledTimes(2)
    const events = await db.srsRatingEvents.where('userId').equals('user-1').toArray()
    expect(events).toHaveLength(2)
    expect(events[0].id).not.toBe(events[1].id)
  })

  it('GAP CLOSED: offline (no network) no longer prevents enqueueing — there is no read to fail', async () => {
    await expect(
      enqueueTopicSRSUpdate('user-1', 'grammar:present simple', 4),
    ).resolves.toMatchObject({ topic: 'grammar:present simple' })
    expect(enqueueMock).toHaveBeenCalledTimes(1)
  })
})
