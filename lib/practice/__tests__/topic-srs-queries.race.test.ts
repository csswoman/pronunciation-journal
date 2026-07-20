/**
 * Characterization tests for lib/practice/topic-srs-queries.ts
 * `enqueueTopicSRSUpdate`.
 *
 * Plan 061 step 1: these document CURRENT (buggy) behavior before the step
 * 2-7 hardening work — not the desired end state. Framing: PASS = "this is
 * the bug, reproduced today." Each test name states which framing it uses.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const enqueueMock = vi.fn()
vi.mock('@/lib/sync/sync-manager', () => ({
  enqueue: (...args: unknown[]) => enqueueMock(...args),
}))

const maybeSingleMock = vi.fn()
vi.mock('@/lib/supabase/client', () => ({
  getSupabaseBrowserClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({ maybeSingle: maybeSingleMock }),
        }),
      }),
    }),
  }),
}))

import { enqueueTopicSRSUpdate } from '../topic-srs-queries'

const NOW = new Date('2026-07-20T12:00:00.000Z')

describe('enqueueTopicSRSUpdate races', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
    enqueueMock.mockReset()
    maybeSingleMock.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('BUG: two overlapping ratings for a brand-new topic (no existing topic_srs row) both read "no row" and both enqueue an INSERT — one insert should have been an update', async () => {
    // Both calls resolve "no row exists yet" — this simulates two
    // near-simultaneous first-time ratings for the same new topic (e.g. two
    // quick answers before either enqueue has landed and been reflected back
    // in Supabase).
    maybeSingleMock.mockResolvedValue({ data: null, error: null })

    const first = enqueueTopicSRSUpdate('user-1', 'grammar:present simple', 4)
    const second = enqueueTopicSRSUpdate('user-1', 'grammar:present simple', 5)
    await Promise.all([first, second])

    expect(enqueueMock).toHaveBeenCalledTimes(2)
    const [firstTable, firstOp, firstPayload] = enqueueMock.mock.calls[0]
    const [secondTable, secondOp, secondPayload] = enqueueMock.mock.calls[1]

    expect(firstTable).toBe('topic_srs')
    expect(secondTable).toBe('topic_srs')

    // Today: BOTH are 'insert' with review_count: 1, because neither read
    // saw the other's not-yet-applied row. A correct implementation would
    // produce one insert (review_count: 1) and one update (review_count: 2)
    // building on the first, or serialize the two grades into a single
    // final state with review_count: 2.
    expect(firstOp).toBe('insert')
    expect(secondOp).toBe('insert')
    expect((firstPayload as Record<string, unknown>).review_count).toBe(1)
    expect((secondPayload as Record<string, unknown>).review_count).toBe(1) // should have been 2

    // If both inserts reach Supabase, the second will violate a unique
    // constraint on (user_id, topic) and be lost/retried as a duplicate —
    // either way the two ratings do not collapse into one coherent row with
    // review_count 2.
  })

  it('BUG: two overlapping ratings for an existing topic read the same pre-rating snapshot, so the second enqueued update does not build on the first (lost update)', async () => {
    const snapshot = {
      id: 'row-9',
      ease_factor: 2.5,
      interval_days: 1,
      repetitions: 1,
      next_review_at: '2026-07-19T00:00:00.000Z',
      srs_status: 'review',
      last_reviewed_at: '2026-07-13T00:00:00.000Z',
      review_count: 3,
    }
    maybeSingleMock.mockResolvedValue({ data: snapshot, error: null })

    const first = enqueueTopicSRSUpdate('user-1', 'grammar:present simple', 4)
    const second = enqueueTopicSRSUpdate('user-1', 'grammar:present simple', 4)
    await Promise.all([first, second])

    expect(enqueueMock).toHaveBeenCalledTimes(2)
    const firstPayload = enqueueMock.mock.calls[0][2] as Record<string, unknown>
    const secondPayload = enqueueMock.mock.calls[1][2] as Record<string, unknown>

    // Both computed review_count = snapshot.review_count + 1 = 4, from the
    // SAME stale snapshot. The second rating's effect never compounds onto
    // the first's — whichever write lands last in Supabase determines the
    // final (wrong) review_count of 4 instead of the honest 5.
    expect(firstPayload.review_count).toBe(4)
    expect(secondPayload.review_count).toBe(4)
    expect(secondPayload.review_count).not.toBe(5)
  })

  it('GAP: when the Supabase read fails (offline), the function throws and never enqueues — there is no offline path today', async () => {
    const offlineError = new Error('Failed to fetch')
    maybeSingleMock.mockResolvedValue({ data: null, error: offlineError })

    await expect(
      enqueueTopicSRSUpdate('user-1', 'grammar:present simple', 4),
    ).rejects.toThrow('Failed to fetch')
    expect(enqueueMock).not.toHaveBeenCalled()
  })
})
