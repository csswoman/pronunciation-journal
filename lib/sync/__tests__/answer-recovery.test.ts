// @vitest-environment node
import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createAnswerHistoryRemote, CONTEXTS_BEFORE_045, type AnswerHistoryRemote } from './fixtures/answer-history-remote'

const { from, rpc } = vi.hoisted(() => ({ from: vi.fn(), rpc: vi.fn() }))

vi.mock('@/lib/supabase/client', () => ({
  getSupabaseBrowserClient: () => ({ from, rpc }),
}))

import { db } from '@/lib/db'
import { flushOutbox, enqueue } from '../sync-manager'
import { MAX_ANSWER_RECOVERIES, recoverRepairedAnswerFailures } from '../answer-recovery'

const USER_A = 'user-a'
const USER_B = 'user-b'
let remote: AnswerHistoryRemote
let uuidSeq = 0

function uuid(): string {
  uuidSeq++
  return `00000000-0000-4000-8000-${String(uuidSeq).padStart(12, '0')}`
}

/** Synthetic Essential Words answer + its own SRS rating, as one local write enqueues them. */
async function enqueueEssentialAnswer(userId: string, context = 'essential-words'): Promise<string> {
  const id = uuid()
  await enqueue(userId, 'answer_history', 'upsert', {
    id, user_id: userId, exercise_type_id: 5, is_correct: true, context,
    content_id: 'word-1', exercise_payload: { status: 'answered' }, grade: 4,
  }, undefined, 'id')
  await enqueue(userId, 'word_bank', 'rpc', {
    p_word_id: `word-${id}`, p_grade: 4, p_idempotency_key: `rating-${id}`,
  }, undefined, undefined, 'apply_word_bank_rating_event')
  return id
}

async function answerEntries() {
  return (await db.syncOutbox.toArray()).filter((entry) => entry.table === 'answer_history')
}

beforeEach(async () => {
  db.close()
  await db.delete()
  await db.open()
  Object.defineProperty(globalThis, 'navigator', { value: { onLine: true }, configurable: true })
  remote = createAnswerHistoryRemote(CONTEXTS_BEFORE_045)
  from.mockReset()
  rpc.mockReset()
  from.mockImplementation(() => ({ upsert: (row: Record<string, unknown>) => remote.upsert(row) }))
  rpc.mockResolvedValue({ error: null })
})

afterEach(() => db.close())

describe('characterization: Essential Words answers before the CHECK repair', () => {
  it('is rejected with 23514 and parked as a permanent failure while its SRS rating syncs', async () => {
    await enqueueEssentialAnswer(USER_A)
    const result = await flushOutbox(USER_A)

    expect(result).toMatchObject({ synced: 1, failed: 1 })
    const [answer] = await answerEntries()
    expect(answer).toMatchObject({ status: 'failed', errorCode: '23514', failureKind: 'permanent' })
    expect(answer.errorMessage).toContain('answer_history_context_check')
    expect(rpc).toHaveBeenCalledTimes(1)
  })
})

describe('recoverRepairedAnswerFailures', () => {
  async function parkEssentialAnswer(userId = USER_A) {
    const id = await enqueueEssentialAnswer(userId)
    await flushOutbox(userId)
    return id
  }

  it('requeues the repaired answer once, preserving id/payload and without replaying SRS', async () => {
    const id = await parkEssentialAnswer()
    const [parked] = await answerEntries()
    remote.applyMigration045()

    const recovery = await recoverRepairedAnswerFailures(USER_A)
    const flush = await flushOutbox(USER_A)

    expect(recovery.requeued).toBe(1)
    expect(flush).toMatchObject({ synced: 1, failed: 0 })
    expect(remote.rows.get(id)).toMatchObject({
      id, context: 'essential-words', grade: 4, exercise_payload: { status: 'answered' },
      answered_at: parked.createdAt,
    })
    expect(rpc).toHaveBeenCalledTimes(1)
    expect(await db.syncOutbox.count()).toBe(0)
  })

  it('leaves a 23514 from another constraint or unrepaired context isolated', async () => {
    await enqueueEssentialAnswer(USER_A, 'bogus-context')
    await flushOutbox(USER_A)
    const otherConstraint = await db.syncOutbox.add({
      userId: USER_A, table: 'answer_history', operation: 'upsert', status: 'failed',
      payload: { id: uuid(), user_id: USER_A, context: 'essential-words' },
      createdAt: new Date().toISOString(), retryCount: 1, failureKind: 'permanent', errorCode: '23514',
      errorMessage: 'new row for relation "answer_history" violates check constraint "answer_history_grade_check"',
    })
    remote.applyMigration045()

    expect((await recoverRepairedAnswerFailures(USER_A)).requeued).toBe(0)
    expect((await answerEntries()).every((entry) => entry.status === 'failed')).toBe(true)
    expect((await db.syncOutbox.get(otherConstraint))?.status).toBe('failed')
  })

  it('only touches the active user when the account changes', async () => {
    await parkEssentialAnswer(USER_A)
    await parkEssentialAnswer(USER_B)
    remote.applyMigration045()

    await recoverRepairedAnswerFailures(USER_B)
    await flushOutbox(USER_B)

    const remaining = await answerEntries()
    expect(remaining).toHaveLength(1)
    expect(remaining[0]).toMatchObject({ userId: USER_A, status: 'failed' })
    expect([...remote.rows.values()].map((row) => row.user_id)).toEqual([USER_B])
  })

  it('stays idempotent under a double recovery and double flush', async () => {
    const id = await parkEssentialAnswer()
    remote.applyMigration045()

    await Promise.all([recoverRepairedAnswerFailures(USER_A), recoverRepairedAnswerFailures(USER_A)])
    const [pending] = await answerEntries()
    expect(pending).toMatchObject({ status: 'pending', recoveryCount: 1 })

    await Promise.all([flushOutbox(USER_A), flushOutbox(USER_A)])
    await flushOutbox(USER_A)
    expect([...remote.rows.keys()]).toEqual([id])
    expect(remote.state.upsertCalls).toBe(2) // 1 rejected before the repair + 1 recovered
  })

  it('is bounded when the remote CHECK is still unrepaired', async () => {
    await parkEssentialAnswer()
    let now = Date.now()

    for (let round = 0; round < MAX_ANSWER_RECOVERIES + 2; round++) {
      now += 24 * 60 * 60 * 1000
      await recoverRepairedAnswerFailures(USER_A, { now })
      await flushOutbox(USER_A)
    }

    const [answer] = await answerEntries()
    expect(answer).toMatchObject({ status: 'failed', recoveryCount: MAX_ANSWER_RECOVERIES })
    expect(remote.state.upsertCalls).toBe(1 + MAX_ANSWER_RECOVERIES)
  })
})
