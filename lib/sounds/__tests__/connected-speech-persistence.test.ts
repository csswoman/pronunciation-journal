// @vitest-environment node
import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createAnswerHistoryRemote, CONTEXTS_BEFORE_045, type AnswerHistoryRemote } from '@/lib/sync/__tests__/fixtures/answer-history-remote'

const { from } = vi.hoisted(() => ({ from: vi.fn() }))

vi.mock('@/lib/supabase/client', () => ({
  getSupabaseBrowserClient: () => ({ from }),
}))
vi.mock('@/lib/progress/activity-hub', () => ({
  recordActivitySession: vi.fn().mockResolvedValue(undefined),
}))

import { db } from '@/lib/db'
import { flushOutbox } from '@/lib/sync/sync-manager'
import { recordConnectedSpeechAttempt } from '../queries'

const USER = 'user-cs'
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
let remote: AnswerHistoryRemote

const attempt = {
  phraseId: 'p-1',
  phrase: 'want to',
  category: 'wanna',
  transcript: 'wanna',
  isCorrect: true,
  timeMs: 3000,
}

beforeEach(async () => {
  db.close()
  await db.delete()
  await db.open()
  Object.defineProperty(globalThis, 'navigator', { value: { onLine: true }, configurable: true })
  remote = createAnswerHistoryRemote(CONTEXTS_BEFORE_045)
  from.mockReset()
  from.mockImplementation(() => ({ upsert: (row: Record<string, unknown>) => remote.upsert(row) }))
})

afterEach(() => db.close())

describe('recordConnectedSpeechAttempt persistence', () => {
  it('enqueues a uuid id and keeps score out of the answer_history columns', async () => {
    await recordConnectedSpeechAttempt(USER, attempt)
    const [entry] = await db.syncOutbox.toArray()

    expect(entry.table).toBe('answer_history')
    expect(String(entry.payload.id)).toMatch(UUID_RE)
    expect(entry.payload).not.toHaveProperty('score')
    expect(entry.payload.exercise_payload).toMatchObject({ score: 100, phraseId: 'p-1' })
  })

  it('syncs to the synthetic remote exactly once', async () => {
    await recordConnectedSpeechAttempt(USER, attempt)
    const result = await flushOutbox(USER)

    expect(result).toMatchObject({ synced: 1, failed: 0 })
    expect(remote.rows.size).toBe(1)
    expect(await db.syncOutbox.count()).toBe(0)
  })

  it('keeps the same uuid across a transient retry', async () => {
    await recordConnectedSpeechAttempt(USER, attempt)
    const [queued] = await db.syncOutbox.toArray()

    from.mockImplementationOnce(() => ({
      upsert: () => Promise.resolve({ error: { message: 'Failed to fetch', code: undefined } }),
    }))
    await flushOutbox(USER)
    const [retrying] = await db.syncOutbox.toArray()
    expect(retrying).toMatchObject({ status: 'pending', retryCount: 1 })
    expect(retrying.payload.id).toBe(queued.payload.id)

    await db.syncOutbox.update(retrying.id!, { nextRetryAt: undefined })
    await flushOutbox(USER)
    expect([...remote.rows.keys()]).toEqual([queued.payload.id])
  })

  it('honors a caller-supplied attempt id', async () => {
    const attemptId = '11111111-2222-4333-8444-555555555555'
    await recordConnectedSpeechAttempt(USER, { ...attempt, attemptId })
    const [entry] = await db.syncOutbox.toArray()
    expect(entry.payload.id).toBe(attemptId)
  })
})
