/**
 * Characterization tests for lib/word-bank/srs-queries.ts `enqueueWordBankSRSUpdate`.
 *
 * Plan 061 step 1: these tests document CURRENT (buggy) behavior before the
 * step 2-7 hardening work. They are not asserting the desired end state —
 * they assert "here is what happens today," so a future fix to
 * `enqueueWordBankSRSUpdate` (making it transactional/serial per entity) is
 * expected to change these tests' expectations, not just make them pass.
 *
 * Framing used: PASS = "this is the bug, reproduced." Each test's name says
 * which framing it uses.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const enqueueMock = vi.fn()
vi.mock('@/lib/sync/sync-manager', () => ({
  enqueue: (...args: unknown[]) => enqueueMock(...args),
}))

const singleMock = vi.fn()
vi.mock('@/lib/supabase/client', () => ({
  getSupabaseBrowserClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({ single: singleMock }),
        }),
      }),
    }),
  }),
}))

import { enqueueWordBankSRSUpdate } from '../srs-queries'

const NOW = new Date('2026-07-20T12:00:00.000Z')

function existingRow(overrides: Record<string, unknown> = {}) {
  return {
    ease_factor: 2.5,
    interval_days: 6,
    repetitions: 2,
    next_review_at: '2026-07-19T00:00:00.000Z',
    srs_status: 'review',
    last_reviewed_at: '2026-07-13T00:00:00.000Z',
    review_count: 3,
    ...overrides,
  }
}

describe('enqueueWordBankSRSUpdate races', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
    enqueueMock.mockReset()
    singleMock.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('BUG: two overlapping ratings for the same existing word each read the same pre-rating state, so the second enqueued payload does not build on the first (lost update)', async () => {
    // Both calls resolve the SAME pre-rating snapshot — this simulates two
    // near-simultaneous grades (e.g. two tabs, or a rapid double-tap) racing
    // against the read, which today has no per-entity serialization.
    const snapshot = existingRow()
    singleMock.mockResolvedValue({ data: snapshot, error: null })

    const first = enqueueWordBankSRSUpdate('user-1', 'word-1', 4)
    const second = enqueueWordBankSRSUpdate('user-1', 'word-1', 4)
    await Promise.all([first, second])

    expect(enqueueMock).toHaveBeenCalledTimes(2)
    const firstPayload = enqueueMock.mock.calls[0][2] as Record<string, unknown>
    const secondPayload = enqueueMock.mock.calls[1][2] as Record<string, unknown>

    // Both computed from the SAME starting repetitions/review_count because
    // both reads saw the same row — the second grade's SM-2 computation does
    // NOT know about the first grade's output. If the race were fixed, the
    // second payload's repetitions/review_count would be one step ahead of
    // the first's, not identical to it.
    expect(firstPayload.repetitions).toBe(secondPayload.repetitions)
    expect(firstPayload.review_count).toBe(4) // snapshot.review_count + 1
    expect(secondPayload.review_count).toBe(4) // same +1 from the SAME stale snapshot — should have been 5

    // Whichever enqueued update lands last in Supabase wins — the other
    // rating's effect is silently lost. Final review_count ends up 4, not 5,
    // even though the user rated twice.
    expect(secondPayload.review_count).not.toBe(5)
  })

  it('BASELINE: a single rating correctly increments review_count by one from the read snapshot', async () => {
    singleMock.mockResolvedValue({ data: existingRow({ review_count: 3 }), error: null })

    await enqueueWordBankSRSUpdate('user-1', 'word-1', 4)

    expect(enqueueMock).toHaveBeenCalledTimes(1)
    const payload = enqueueMock.mock.calls[0][2] as Record<string, unknown>
    expect(payload.review_count).toBe(4)
  })

  it('GAP: when the Supabase read fails (offline), the function throws and never enqueues — there is no offline path today', async () => {
    const offlineError = new Error('Failed to fetch')
    singleMock.mockResolvedValue({ data: null, error: offlineError })

    await expect(enqueueWordBankSRSUpdate('user-1', 'word-1', 4)).rejects.toThrow('Failed to fetch')
    expect(enqueueMock).not.toHaveBeenCalled()
  })
})
