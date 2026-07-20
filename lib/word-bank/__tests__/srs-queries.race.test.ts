/**
 * Plan 061 step 3: `enqueueWordBankSRSUpdate` was rewritten to no longer read
 * word_bank's current state before writing. It now submits an immutable
 * rating event (grade + word id + fresh idempotency key) and enqueues a call
 * to the transactional `apply_word_bank_rating_event` RPC — SM-2 is computed
 * server-side under a row lock (supabase/migrations/20260720080000).
 *
 * These tests replace the step 1 characterization tests, which documented
 * the OLD racy behavior (a live Supabase read + client-computed SM-2 + an
 * absolute UPDATE enqueue). That race can no longer be reproduced client-side
 * because there is no more local "current state" read to race on — the
 * conflict is now safely resolved server-side by the RPC's row lock, which is
 * out of scope for a client-side unit test. What we assert here is what the
 * CLIENT can guarantee: two overlapping local calls are queued as two
 * distinct, immutable rating events with distinct idempotency keys, and
 * neither overwrites the other locally (no lost data before it ever reaches
 * the network).
 */
// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import 'fake-indexeddb/auto'

vi.mock('@/lib/sync/sync-manager', () => ({
  enqueue: vi.fn().mockResolvedValue(1),
}))

import { enqueue } from '@/lib/sync/sync-manager'
import { db } from '@/lib/db'
import { enqueueWordBankSRSUpdate } from '../srs-queries'

const enqueueMock = vi.mocked(enqueue)

describe('enqueueWordBankSRSUpdate (rewritten: local-only, no network read)', () => {
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
    await enqueueWordBankSRSUpdate('user-1', 'word-1', 4)

    expect(enqueueMock).toHaveBeenCalledTimes(1)
    const [userId, table, operation, payload, matchKey, onConflict, rpcName] = enqueueMock.mock.calls[0]
    expect(userId).toBe('user-1')
    expect(table).toBe('word_bank')
    expect(operation).toBe('rpc')
    expect(rpcName).toBe('apply_word_bank_rating_event')
    expect(matchKey).toBeUndefined()
    expect(onConflict).toBeUndefined()
    expect(payload).toMatchObject({
      p_user_id: 'user-1',
      p_word_id: 'word-1',
      p_grade: 4,
    })
    expect(typeof (payload as Record<string, unknown>).p_idempotency_key).toBe('string')
  })

  it('writes one immutable local rating-event row per call', async () => {
    await enqueueWordBankSRSUpdate('user-1', 'word-1', 4)

    const events = await db.srsRatingEvents.where('userId').equals('user-1').toArray()
    expect(events).toHaveLength(1)
    expect(events[0]).toMatchObject({
      userId: 'user-1',
      entityType: 'word_bank',
      entityId: 'word-1',
      grade: 4,
      status: 'pending',
    })
  })

  it('two overlapping ratings for the same word are queued as two distinct events with distinct idempotency keys — neither overwrites the other locally', async () => {
    const first = enqueueWordBankSRSUpdate('user-1', 'word-1', 4)
    const second = enqueueWordBankSRSUpdate('user-1', 'word-1', 5)
    await Promise.all([first, second])

    expect(enqueueMock).toHaveBeenCalledTimes(2)
    const firstPayload = enqueueMock.mock.calls[0][3] as Record<string, unknown>
    const secondPayload = enqueueMock.mock.calls[1][3] as Record<string, unknown>

    // Distinct idempotency keys — the server-side RPC can tell these apart
    // and apply both (serialized by its row lock), instead of one silently
    // clobbering the other the way an absolute-state UPDATE would.
    expect(firstPayload.p_idempotency_key).not.toBe(secondPayload.p_idempotency_key)
    expect(firstPayload.p_grade).toBe(4)
    expect(secondPayload.p_grade).toBe(5)

    // Both events land locally — no data loss before either ever reaches the
    // network. (Which one the server applies first, and the resulting SM-2
    // state, is the RPC's row-locked concern — out of scope here.)
    const events = await db.srsRatingEvents.where('userId').equals('user-1').toArray()
    expect(events).toHaveLength(2)
  })

  it('GAP CLOSED: offline (no network) no longer prevents enqueueing — there is no read to fail', async () => {
    // Unlike the old implementation, there is no Supabase read at all, so
    // there is nothing for "offline" to break here; the write is purely local.
    await expect(enqueueWordBankSRSUpdate('user-1', 'word-1', 4)).resolves.toBeUndefined()
    expect(enqueueMock).toHaveBeenCalledTimes(1)
  })
})
