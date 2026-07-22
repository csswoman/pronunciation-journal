/**
 * Persistence tests for the offline-first pronunciation diagnostic (plan
 * 067, step 6). Uses fake-indexeddb + the real Dexie `db`, mirroring
 * lib/sync/__tests__/sync-manager.idempotency.test.ts.
 */
// @vitest-environment node
import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildValidDiagnosticResult } from './fixtures'

const { from } = vi.hoisted(() => ({ from: vi.fn() }))

vi.mock('@/lib/supabase/client', () => ({
  getSupabaseBrowserClient: () => ({ from }),
}))

import { db } from '@/lib/db'
import { flushOutbox } from '@/lib/sync/sync-manager'
import {
  persistPronunciationAssessmentLocal,
  isPronunciationAssessmentSynced,
  reconcileLocalSyncStatus,
  retrySyncPronunciationAssessment,
  getLocalPronunciationAssessments,
} from '../persistence'

describe('persistPronunciationAssessmentLocal', () => {
  beforeEach(async () => {
    db.close()
    await db.delete()
    await db.open()
    Object.defineProperty(globalThis, 'navigator', { value: { onLine: true }, configurable: true })
    from.mockReset()
  })

  afterEach(() => db.close())

  it('rejects an invalid result and does not write local/outbox state', async () => {
    const invalid = { not: 'a valid diagnostic result' }
    const outcome = await persistPronunciationAssessmentLocal('user-1', invalid as never)

    expect(outcome).toEqual({ ok: false, error: 'invalid_result' })
    expect(await db.pronunciationAssessments.count()).toBe(0)
    expect(await db.syncOutbox.count()).toBe(0)
  })

  it('writes a local mirror row and enqueues an outbox insert for a valid result', async () => {
    const result = buildValidDiagnosticResult('user-1')
    const outcome = await persistPronunciationAssessmentLocal('user-1', result)

    expect(outcome.ok).toBe(true)
    if (!outcome.ok) throw new Error('unreachable')

    const local = await db.pronunciationAssessments.get(outcome.id)
    expect(local?.userId).toBe('user-1')
    expect(local?.syncedAt).toBeUndefined()

    const outboxEntries = await db.syncOutbox.where('userId').equals('user-1').toArray()
    expect(outboxEntries).toHaveLength(1)
    expect(outboxEntries[0].table).toBe('pronunciation_assessments')
    expect(outboxEntries[0].operation).toBe('insert')
    expect(outboxEntries[0].payload.id).toBe(outcome.id)
  })

  it('completes offline (navigator offline) and later syncs on reconnect', async () => {
    Object.defineProperty(globalThis, 'navigator', { value: { onLine: false }, configurable: true })

    const result = buildValidDiagnosticResult('user-1')
    const outcome = await persistPronunciationAssessmentLocal('user-1', result)
    expect(outcome.ok).toBe(true)
    if (!outcome.ok) throw new Error('unreachable')

    // Offline: a flush attempt must no-op (per flushOutboxInternal), leaving
    // the entry pending — this is the "offline completion" verify criterion.
    const offlineFlush = await flushOutbox('user-1')
    expect(offlineFlush).toEqual({ synced: 0, failed: 0, skipped: 0, operations: [] })
    expect(await db.syncOutbox.count()).toBe(1)
    expect(await isPronunciationAssessmentSynced(outcome.id)).toBe(false)

    // Reconnect.
    Object.defineProperty(globalThis, 'navigator', { value: { onLine: true }, configurable: true })
    from.mockReturnValue({ insert: vi.fn().mockResolvedValue({ error: null }) })

    const onlineFlush = await flushOutbox('user-1')
    expect(onlineFlush.synced).toBe(1)
    expect(await db.syncOutbox.count()).toBe(0)

    await reconcileLocalSyncStatus('user-1', onlineFlush)
    expect(await isPronunciationAssessmentSynced(outcome.id)).toBe(true)
  })

  it('retries a transient failure and eventually syncs', async () => {
    const result = buildValidDiagnosticResult('user-1')
    const outcome = await persistPronunciationAssessmentLocal('user-1', result)
    if (!outcome.ok) throw new Error('unreachable')

    // First attempt: transient failure (not a permanent-error code/message).
    from.mockReturnValueOnce({
      insert: vi.fn().mockResolvedValue({ error: { message: 'network hiccup', code: undefined } }),
    })
    const firstFlush = await flushOutbox('user-1')
    expect(firstFlush.failed).toBe(1)

    const pendingEntry = await db.syncOutbox.where('userId').equals('user-1').first()
    expect(pendingEntry?.status).toBe('pending')
    expect(pendingEntry?.retryCount).toBe(1)

    // Force the retry to be immediately eligible (bypass backoff wait).
    await db.syncOutbox.update(pendingEntry!.id!, { nextRetryAt: undefined })

    from.mockReturnValueOnce({ insert: vi.fn().mockResolvedValue({ error: null }) })
    const secondFlush = await flushOutbox('user-1')
    expect(secondFlush.synced).toBe(1)
    expect(await db.syncOutbox.count()).toBe(0)
  })

  it('retrySyncPronunciationAssessment is a no-op once the row is marked synced (idempotent transfer)', async () => {
    const result = buildValidDiagnosticResult('user-1')
    const outcome = await persistPronunciationAssessmentLocal('user-1', result)
    if (!outcome.ok) throw new Error('unreachable')

    from.mockReturnValue({ insert: vi.fn().mockResolvedValue({ error: null }) })
    const flushResult = await flushOutbox('user-1')
    await reconcileLocalSyncStatus('user-1', flushResult)
    expect(await isPronunciationAssessmentSynced(outcome.id)).toBe(true)

    const retried = await retrySyncPronunciationAssessment(outcome.id)
    expect(retried).toBe(false)
    expect(await db.syncOutbox.count()).toBe(0)
  })

  it('retrySyncPronunciationAssessment re-enqueues an unsynced row', async () => {
    const result = buildValidDiagnosticResult('user-1')
    const outcome = await persistPronunciationAssessmentLocal('user-1', result)
    if (!outcome.ok) throw new Error('unreachable')

    // Drop the outbox entry to simulate "somehow lost from the queue" without
    // touching the local mirror's syncedAt flag.
    await db.syncOutbox.clear()
    expect(await db.syncOutbox.count()).toBe(0)

    const retried = await retrySyncPronunciationAssessment(outcome.id)
    expect(retried).toBe(true)
    expect(await db.syncOutbox.count()).toBe(1)
  })

  it('getLocalPronunciationAssessments returns only the requesting user\'s rows, most recent first', async () => {
    const r1 = await persistPronunciationAssessmentLocal('user-1', buildValidDiagnosticResult('user-1'))
    await new Promise((resolve) => setTimeout(resolve, 2))
    const r2 = await persistPronunciationAssessmentLocal('user-1', buildValidDiagnosticResult('user-1'))
    await persistPronunciationAssessmentLocal('user-2', buildValidDiagnosticResult('user-2'))
    if (!r1.ok || !r2.ok) throw new Error('unreachable')

    const rows = await getLocalPronunciationAssessments('user-1')
    expect(rows.map((r) => r.id)).toEqual([r2.id, r1.id])
  })
})
