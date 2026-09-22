// @vitest-environment node
import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { from } = vi.hoisted(() => ({ from: vi.fn() }))

vi.mock('@/lib/supabase/client', () => ({
  getSupabaseBrowserClient: () => ({ from }),
}))

import { db } from '@/lib/db'
import { flushOutbox } from '@/lib/sync/sync-manager'
import { readClusterProgress, recordAttempt } from '../progress'

describe('ed drill evidence persistence', () => {
  beforeEach(async () => {
    db.close()
    await db.delete()
    await db.open()
    from.mockReset()
    Object.defineProperty(globalThis, 'navigator', {
      value: { onLine: true }, writable: true, configurable: true,
    })
  })

  afterEach(() => db.close())

  it('keeps retried evaluated attempts immutable while updating only the local aggregate', async () => {
    const first = await recordAttempt('user-a', 'kt', {
      correct: false, suspectedEpenthesis: false, level: 1, phase: 1,
    })
    const retry = await recordAttempt('user-a', 'kt', {
      correct: true, suspectedEpenthesis: true, level: 1, phase: 2,
    })

    expect(first.attempt.id).not.toBe(retry.attempt.id)
    expect(retry.progress).toMatchObject({ attemptsCount: 2, accuracy: 0.5, epenthesisWarningsCount: 1 })
    expect(await db.edClusterAttempts.where('[userId+cluster]').equals(['user-a', 'kt']).count()).toBe(2)
    expect(await db.syncOutbox.where('userId').equals('user-a').count()).toBe(2)
  })

  it('does not mix an identical cluster from another account', async () => {
    await recordAttempt('user-a', 'kt', { correct: false, suspectedEpenthesis: false, phase: 1 })
    await recordAttempt('user-b', 'kt', { correct: true, suspectedEpenthesis: false, phase: 1 })

    expect((await readClusterProgress('user-a')).get('kt')?.accuracy).toBe(0)
    expect((await readClusterProgress('user-b')).get('kt')?.accuracy).toBe(1)
  })

  it('retains an offline attempt and synchronizes its stable id on recovery', async () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: { onLine: false }, writable: true, configurable: true,
    })
    const { attempt } = await recordAttempt('user-a', 'pt', {
      correct: true, suspectedEpenthesis: false, phase: 1,
    })

    expect(await flushOutbox('user-a')).toEqual({ synced: 0, failed: 0, skipped: 0, operations: [] })
    expect(await db.syncOutbox.count()).toBe(1)

    Object.defineProperty(globalThis, 'navigator', {
      value: { onLine: true }, writable: true, configurable: true,
    })
    const insert = vi.fn().mockResolvedValue({ error: null })
    from.mockReturnValue({ insert })

    expect((await flushOutbox('user-a')).synced).toBe(1)
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ id: attempt.id, user_id: 'user-a' }))
    expect(await db.syncOutbox.count()).toBe(0)
  })
})
