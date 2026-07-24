// @vitest-environment node
import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/lib/db'
import { createTrackingReviewSession, loadTrackingReviewSession } from '../session-store'
import type { TrackingReviewQueue } from '../review-queue'

const queue: TrackingReviewQueue = { items: [], exercises: [], skipped: [] }

describe('tracking review session store', () => {
  beforeEach(async () => {
    db.close()
    await db.delete()
    await db.open()
  })

  afterEach(() => db.close())

  it('recovers the exact queue offline', async () => {
    const created = await createTrackingReviewSession('user-a', queue)
    const loaded = await loadTrackingReviewSession('user-a', created.id)
    expect(loaded?.queue).toEqual(queue)
  })

  it('never lets account B load account A session state', async () => {
    const created = await createTrackingReviewSession('user-a', {
      ...queue,
      skipped: [{
        itemId: 'a', kind: 'phrase', title: 'private phrase', code: 'canonical_target_unresolved', detail: 'private',
      }],
    })
    expect(await loadTrackingReviewSession('user-b', created.id)).toBeNull()
    expect(await loadTrackingReviewSession('user-a', created.id)).not.toBeNull()
  })
})
