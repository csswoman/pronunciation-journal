// @vitest-environment node
import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { from } = vi.hoisted(() => ({ from: vi.fn() }))
vi.mock('@/lib/supabase/client', () => ({
  getSupabaseBrowserClient: () => ({ from }),
}))

import { db } from '@/lib/db'
import { hydrateTrackedItems } from '../queries'

describe('hydrateTrackedItems', () => {
  beforeEach(async () => {
    db.close()
    await db.delete()
    await db.open()
    from.mockReset()
  })

  afterEach(() => db.close())

  it('does not let a server refresh overwrite a locally pending tracked item', async () => {
    await db.trackedItems.add({
      id: 'pending-item', userId: 'user-1', kind: 'phrase', ref: 'old-ref', title: 'Local title',
      payload: {}, createdAt: '2026-07-18T10:00:00.000Z', updatedAt: '2026-07-18T10:00:00.000Z',
    })
    await db.syncOutbox.add({
      table: 'tracked_items', operation: 'upsert', payload: { id: 'pending-item' },
      status: 'pending', createdAt: '2026-07-18T10:00:00.000Z', retryCount: 0,
    })
    const remoteRows = [
      { id: 'pending-item', user_id: 'user-1', kind: 'phrase', ref: 'server-ref', title: 'Server title', payload: {}, created_at: '2026-07-18T10:00:00.000Z', updated_at: '2026-07-18T11:00:00.000Z' },
      { id: 'fresh-item', user_id: 'user-1', kind: 'lesson', ref: 'lesson-1', title: 'Fresh', payload: {}, created_at: '2026-07-18T10:00:00.000Z', updated_at: '2026-07-18T11:00:00.000Z' },
    ]
    from.mockReturnValue({ select: () => ({ eq: () => Promise.resolve({ data: remoteRows, error: null }) }) })

    await hydrateTrackedItems('user-1')

    expect((await db.trackedItems.get('pending-item'))?.ref).toBe('old-ref')
    expect((await db.trackedItems.get('fresh-item'))?.title).toBe('Fresh')
  })
})
