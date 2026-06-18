import { describe, it, expect, vi, beforeEach } from 'vitest'

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

import { enqueueTopicSRSUpdate } from '@/lib/practice/topic-srs-queries'

beforeEach(() => {
  enqueueMock.mockReset()
  maybeSingleMock.mockReset()
})

describe('enqueueTopicSRSUpdate', () => {
  it('inserts a new topic row when none exists', async () => {
    maybeSingleMock.mockResolvedValue({ data: null, error: null })

    await enqueueTopicSRSUpdate('user-1', 'grammar:present simple', 5)

    expect(enqueueMock).toHaveBeenCalledTimes(1)
    const [table, op, payload] = enqueueMock.mock.calls[0]
    expect(table).toBe('topic_srs')
    expect(op).toBe('insert')
    expect(payload).toMatchObject({
      user_id: 'user-1',
      topic: 'grammar:present simple',
      review_count: 1,
    })
    expect(typeof payload.ease_factor).toBe('number')
    expect(payload.next_review_at).toBeTruthy()
  })

  it('updates an existing topic row with a matchKey', async () => {
    maybeSingleMock.mockResolvedValue({
      data: {
        id: 'row-9',
        ease_factor: 2.5,
        interval_days: 1,
        repetitions: 1,
        next_review_at: '2026-06-10T00:00:00.000Z',
        srs_status: 'review',
        last_reviewed_at: '2026-06-09T00:00:00.000Z',
        review_count: 3,
      },
      error: null,
    })

    await enqueueTopicSRSUpdate('user-1', 'grammar:present simple', 1)

    const [table, op, payload, matchKey] = enqueueMock.mock.calls[0]
    expect(table).toBe('topic_srs')
    expect(op).toBe('update')
    expect(payload).toMatchObject({ review_count: 4 })
    expect(matchKey).toEqual({ id: 'row-9', user_id: 'user-1' })
  })
})
