// @vitest-environment node
import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { from } = vi.hoisted(() => ({ from: vi.fn() }))

vi.mock('@/lib/supabase/client', () => ({
  getSupabaseBrowserClient: () => ({ from }),
}))

import { db } from '@/lib/db'
import { flushOutbox } from '../sync-manager'

describe('flushOutbox batch isolation', () => {
  beforeEach(async () => {
    db.close()
    await db.delete()
    await db.open()
    Object.defineProperty(globalThis, 'navigator', { value: { onLine: true }, configurable: true })
    from.mockReset()
  })

  afterEach(() => db.close())

  it('does not release a different fresh syncing entry while its claimed batch resolves', async () => {
    const currentTime = Date.now()
    const claimedId = await db.syncOutbox.add({
      table: 'answer_history', operation: 'upsert', payload: { id: 'claimed' },
      status: 'syncing', createdAt: new Date(currentTime - 1_000).toISOString(),
      lastAttemptAt: new Date(currentTime - 5 * 60_000).toISOString(), retryCount: 0,
    })
    const otherId = await db.syncOutbox.add({
        table: 'answer_history', operation: 'upsert', payload: { id: 'other' },
      status: 'syncing', createdAt: new Date(currentTime).toISOString(),
      lastAttemptAt: new Date(currentTime).toISOString(), retryCount: 0,
    })
    let resolveUpsert: (value: { error: null }) => void
    from.mockReturnValue({
      upsert: vi.fn(() => new Promise<{ error: null }>((resolve) => { resolveUpsert = resolve })),
    })

    const flush = flushOutbox()
    await vi.waitFor(async () => expect((await db.syncOutbox.get(claimedId))?.status).toBe('syncing'))
    resolveUpsert!({ error: null })
    await flush

    expect(await db.syncOutbox.get(claimedId)).toBeUndefined()
    expect((await db.syncOutbox.get(otherId))?.status).toBe('syncing')
  })

  it('returns one shared promise for overlapping calls in the same tab', async () => {
    await db.syncOutbox.add({
      table: 'answer_history', operation: 'upsert', payload: { id: 'pending' },
      status: 'pending', createdAt: new Date().toISOString(), retryCount: 0,
    })
    let resolveUpsert: (value: { error: null }) => void
    const upsert = vi.fn(() => new Promise<{ error: null }>((resolve) => { resolveUpsert = resolve }))
    from.mockReturnValue({ upsert })

    const first = flushOutbox()
    const second = flushOutbox()
    expect(second).toBe(first)
    await vi.waitFor(() => expect(upsert).toHaveBeenCalledOnce())
    resolveUpsert!({ error: null })
    await first
    expect(upsert).toHaveBeenCalledOnce()
  })
})
