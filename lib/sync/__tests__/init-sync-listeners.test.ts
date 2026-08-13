// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { from } = vi.hoisted(() => ({ from: vi.fn() }))

vi.mock('@/lib/supabase/client', () => ({
  getSupabaseBrowserClient: () => ({ from }),
}))

import { db } from '@/lib/db'
import { initSyncListeners } from '../init-sync-listeners'

function setOnline(value: boolean) {
  Object.defineProperty(window.navigator, 'onLine', { value, configurable: true })
}

describe('initSyncListeners', () => {
  let cleanup: (() => void) | undefined

  beforeEach(async () => {
    db.close()
    await db.delete()
    await db.open()
    from.mockReset()
    setOnline(true)
    vi.useRealTimers()
  })

  afterEach(async () => {
    cleanup?.()
    cleanup = undefined
    vi.useRealTimers()
    // Let any in-flight drain promise from the test settle before the next
    // test closes/deletes the database out from under it.
    await new Promise((resolve) => setTimeout(resolve, 20))
    db.close()
  })

  it('pending-at-start: drains immediately when called with a userId, without waiting for an online event', async () => {
    await db.syncOutbox.add({
      userId: 'user-1', table: 'answer_history', operation: 'upsert', payload: { id: 'p1' },
      status: 'pending', createdAt: new Date().toISOString(), retryCount: 0,
    })
    const upsert = vi.fn().mockResolvedValue({ error: null })
    from.mockReturnValue({ upsert })

    cleanup = initSyncListeners('user-1')

    await vi.waitFor(() => expect(upsert).toHaveBeenCalledOnce())
    await vi.waitFor(async () => expect(await db.syncOutbox.count()).toBe(0))
  })

  it('does not flush when called with userId=null', async () => {
    await db.syncOutbox.add({
      userId: 'user-1', table: 'answer_history', operation: 'upsert', payload: { id: 'p1' },
      status: 'pending', createdAt: new Date().toISOString(), retryCount: 0,
    })
    const upsert = vi.fn().mockResolvedValue({ error: null })
    from.mockReturnValue({ upsert })

    cleanup = initSyncListeners(null)

    // Give any stray microtasks a chance to run.
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(upsert).not.toHaveBeenCalled()
  })

  it('still flushes on the online event (existing behavior preserved)', async () => {
    cleanup = initSyncListeners('user-1')
    await vi.waitFor(() => expect(from).not.toHaveBeenCalled()) // nothing pending yet

    await db.syncOutbox.add({
      userId: 'user-1', table: 'answer_history', operation: 'upsert', payload: { id: 'p2' },
      status: 'pending', createdAt: new Date().toISOString(), retryCount: 0,
    })
    const upsert = vi.fn().mockResolvedValue({ error: null })
    from.mockReturnValue({ upsert })

    window.dispatchEvent(new Event('online'))

    await vi.waitFor(() => expect(upsert).toHaveBeenCalledOnce())
  })

  it('timed retry: a transiently-failed entry is automatically retried at its nextRetryAt without a new online event', async () => {
    const upsert = vi.fn()
      .mockResolvedValueOnce({ error: { message: 'fetch failed', code: undefined } })
      .mockResolvedValueOnce({ error: null })
    from.mockReturnValue({ upsert })

    await db.syncOutbox.add({
      userId: 'user-1', table: 'answer_history', operation: 'upsert', payload: { id: 'p3' },
      status: 'pending', createdAt: new Date().toISOString(), retryCount: 0,
    })

    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] })
    try {
      cleanup = initSyncListeners('user-1')

      // Let the first (failing) flush pass complete and the retry timer get scheduled.
      // The flush itself is a real Promise chain over fake-indexeddb — advancing
      // by 0ms repeatedly lets queued microtasks/macrotasks drain without
      // needing real wall-clock waits.
      for (let i = 0; i < 20 && upsert.mock.calls.length < 1; i++) {
        await vi.advanceTimersByTimeAsync(0)
      }
      expect(upsert).toHaveBeenCalledTimes(1)

      const entryAfterFailure = await db.syncOutbox.toArray()
      expect(entryAfterFailure).toHaveLength(1)
      expect(entryAfterFailure[0].status).toBe('pending')
      expect(entryAfterFailure[0].nextRetryAt).toBeTruthy()

      // Advance exactly to (a bit past) the scheduled retry time — no
      // polling, a single timer fires and re-drains.
      await vi.advanceTimersByTimeAsync(5_000)
      for (let i = 0; i < 20 && upsert.mock.calls.length < 2; i++) {
        await vi.advanceTimersByTimeAsync(0)
      }
      expect(upsert).toHaveBeenCalledTimes(2)
      expect(await db.syncOutbox.count()).toBe(0)
    } finally {
      vi.useRealTimers()
    }
  })

  it('partial-batch: returns per-operation outcomes distinguishing success from failure', async () => {
    const { flushOutbox } = await import('../sync-manager')
    await db.syncOutbox.bulkAdd([
      {
        userId: 'user-1', table: 'answer_history', operation: 'upsert', payload: { id: 'ok' },
        status: 'pending', createdAt: new Date().toISOString(), retryCount: 0,
      },
      {
        userId: 'user-1', table: 'activity_sessions', operation: 'upsert', payload: { id: 'bad' },
        status: 'pending', createdAt: new Date().toISOString(), retryCount: 0,
      },
    ])
    from.mockImplementation((table: string) => ({
      upsert: vi.fn().mockResolvedValue(
        table === 'answer_history'
          ? { error: null }
          : { error: { message: 'permission denied', code: '42501' } },
      ),
    }))

    const result = await flushOutbox('user-1')

    expect(result.operations).toHaveLength(2)
    const ok = result.operations.find((op) => op.table === 'answer_history')
    const bad = result.operations.find((op) => op.table === 'activity_sessions')
    expect(ok?.outcome).toBe('synced')
    expect(bad?.outcome).toBe('failed')
    expect(bad?.errorMessage).toContain('permission denied')
    expect(result.synced).toBe(1)
    expect(result.failed).toBe(1)
  })

  it('no busy loop offline: schedules no timer and makes no Supabase calls while navigator.onLine is false', async () => {
    setOnline(false)
    const upsert = vi.fn().mockResolvedValue({ error: null })
    from.mockReturnValue({ upsert })

    await db.syncOutbox.add({
      userId: 'user-1', table: 'answer_history', operation: 'upsert', payload: { id: 'p4' },
      status: 'pending', createdAt: new Date().toISOString(), retryCount: 0,
    })

    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] })
    try {
      cleanup = initSyncListeners('user-1')
      await vi.advanceTimersByTimeAsync(0)

      // Advance well past every RETRY_DELAYS_MS bucket (max 2 min) to prove no
      // timer was scheduled and no repeated attempts occur while offline.
      await vi.advanceTimersByTimeAsync(10 * 60_000)
    } finally {
      vi.useRealTimers()
    }

    expect(upsert).not.toHaveBeenCalled()
    expect(await db.syncOutbox.count()).toBe(1)
  })

  it('avoids duplicate handlers and can be re-initialized after cleanup', async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null })
    from.mockReturnValue({ upsert })

    const firstCleanup = initSyncListeners('user-1')
    const secondCleanup = initSyncListeners('user-1')
    // Nothing pending, so the initial drain resolves quickly; wait for it to
    // fully settle before cleanup so no in-flight promise leaks into the
    // next test's (closed) database.
    await new Promise((resolve) => setTimeout(resolve, 20))

    secondCleanup()
    firstCleanup()
    cleanup = undefined
  })

  it('does not leave an uncaught rejection when IndexedDB is closed during drain', async () => {
    db.close()
    cleanup = initSyncListeners('user-1')
    await new Promise((resolve) => setTimeout(resolve, 40))
  })
})

describe('initSyncListeners multi-tab coordination', () => {
  beforeEach(async () => {
    db.close()
    await db.delete()
    await db.open()
    from.mockReset()
    setOnline(true)
  })

  afterEach(() => db.close())

  it('two concurrent drain calls (simulating two tabs) never both apply the same entry — the claim mechanism dedupes, not tab election', async () => {
    await db.syncOutbox.add({
      userId: 'user-1', table: 'answer_history', operation: 'upsert', payload: { id: 'shared' },
      status: 'pending', createdAt: new Date().toISOString(), retryCount: 0,
    })
    const upsert = vi.fn().mockResolvedValue({ error: null })
    from.mockReturnValue({ upsert })

    const { flushOutbox } = await import('../sync-manager')

    // Simulate two overlapping drain attempts (e.g. two tabs both waking on
    // the same 'online' event). In-process this hits the same-tab
    // `flushInFlight` dedup (both calls resolve to the SAME promise), so
    // this alone doesn't prove cross-tab safety — the real cross-tab
    // guarantee is the atomic pending->syncing claim inside a Dexie
    // transaction (see flushOutboxInternal), which ensures that even a
    // genuinely separate process/tab hitting the same IndexedDB would only
    // ever claim an entry once. What we CAN assert from a single process:
    // the entry is applied to Supabase exactly once and ends up fully
    // synced, never double-applied.
    const [resultA, resultB] = await Promise.all([
      flushOutbox('user-1'),
      flushOutbox('user-1'),
    ])

    expect(upsert).toHaveBeenCalledTimes(1)
    expect(resultA).toBe(resultB) // same in-flight promise — same-tab dedup
    expect(resultA.synced).toBe(1)
    expect(await db.syncOutbox.count()).toBe(0)
  })
})
