// @vitest-environment node
import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { from } = vi.hoisted(() => ({ from: vi.fn() }))
vi.mock('@/lib/supabase/client', () => ({
  getSupabaseBrowserClient: () => ({ from }),
}))

import { db } from '@/lib/db'
import { hydrateContentSrs } from '../content-srs-queries'

const remoteRow = {
  user_id: 'user-1',
  content_id: 'hello-there',
  namespace: 'chunks' as const,
  stability: 4.2,
  difficulty: 5.1,
  state: 'Review',
  interval: 3,
  repetitions: 2,
  fsrs_real_reviews: 2,
  next_review_at: '2026-09-25T12:00:00.000Z',
  last_review_at: '2026-09-22T12:00:00.000Z',
  updated_at: '2026-09-22T12:00:00.000Z',
}

describe('hydrateContentSrs', () => {
  beforeEach(async () => {
    db.close()
    await db.delete()
    await db.open()
    from.mockReset()
    from.mockReturnValue({
      select: () => ({ eq: () => Promise.resolve({ data: [remoteRow], error: null }) }),
    })
  })

  afterEach(() => db.close())

  it('writes a newer remote schedule to the user-scoped local mirror', async () => {
    await hydrateContentSrs('user-1')

    await expect(db.srsData.where('[userId+wordId]').equals(['user-1', 'chunk:hello-there']).first())
      .resolves.toMatchObject({
        userId: 'user-1',
        wordId: 'chunk:hello-there',
        state: 'Review',
        fsrsRealReviews: 2,
        nextReview: remoteRow.next_review_at,
      })
  })

  it('keeps a more recent local schedule', async () => {
    await db.srsData.put({
      userId: 'user-1',
      wordId: 'chunk:hello-there',
      word: 'hello-there',
      ease: 2.5,
      interval: 7,
      repetitions: 3,
      nextReview: '2026-09-29T12:00:00.000Z',
      lastReview: '2026-09-23T12:00:00.000Z',
    })

    await hydrateContentSrs('user-1')

    await expect(db.srsData.where('[userId+wordId]').equals(['user-1', 'chunk:hello-there']).first())
      .resolves.toMatchObject({ interval: 7, repetitions: 3 })
  })
})
