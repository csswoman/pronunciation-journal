/**
 * Plan 061 step 3 verification: `savePracticeAnswer` wraps the
 * answer_history enqueue + word/topic rating-event writes (+ fragment SRS
 * write) in one Dexie transaction, so a crash between writes can never leave
 * a partial result — either all operations land, or none do.
 *
 * Uses fake-indexeddb + the real Dexie `db`, mirroring
 * lib/sync/__tests__/sync-manager.idempotency.test.ts's conventions, so the
 * rollback behavior under test is Dexie's real transactional guarantee, not
 * a mocked approximation of it.
 */
// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import 'fake-indexeddb/auto'

vi.mock('@/lib/supabase/client', () => ({
  getSupabaseBrowserClient: () => {
    throw new Error('savePracticeAnswer must not read/write Supabase directly — outbox only')
  },
}))

import { db } from '@/lib/db'
import { savePracticeAnswer } from '../queries'
import type { PracticeAnswer } from '../types'

const WORD_BANK_UUID = '550e8400-e29b-41d4-a716-446655440000'

const baseAnswer: PracticeAnswer = {
  exerciseId: 'e1',
  slug: 'fill_blank',
  exerciseTypeId: 5,
  isCorrect: true,
  timeMs: 1000,
  contentId: `word_bank:${WORD_BANK_UUID}`,
  context: 'practice',
  // Plan 062: word_bank sourceRef.id must be a real UUID (catalog ids are rejected).
  sourceRef: { source: 'word_bank', id: WORD_BANK_UUID },
  topic: 'grammar:present simple',
}

describe('savePracticeAnswer transactional atomicity', () => {
  beforeEach(async () => {
    db.close()
    await db.delete()
    await db.open()
  })

  afterEach(() => db.close())

  it('success path: answer, word rating, and topic rating all land atomically', async () => {
    await savePracticeAnswer('user-1', baseAnswer)

    const outboxEntries = await db.syncOutbox.where('userId').equals('user-1').toArray()
    const answerEntries = outboxEntries.filter((e) => e.table === 'answer_history')
    const wordRpcEntries = outboxEntries.filter((e) => e.table === 'word_bank' && e.operation === 'rpc')
    const topicRpcEntries = outboxEntries.filter((e) => e.table === 'topic_srs' && e.operation === 'rpc')

    expect(answerEntries).toHaveLength(1)
    expect(wordRpcEntries).toHaveLength(1)
    expect(topicRpcEntries).toHaveLength(1)

    const ratingEvents = await db.srsRatingEvents.where('userId').equals('user-1').toArray()
    expect(ratingEvents).toHaveLength(2)
    expect(ratingEvents.some((e) => e.entityType === 'word_bank' && e.entityId === WORD_BANK_UUID)).toBe(true)
    expect(ratingEvents.some((e) => e.entityType === 'topic_srs' && e.topic === 'grammar:present simple')).toBe(true)
  })

  it('crash simulation: a failure partway through the transaction rolls back ALL operations — none land', async () => {
    // Force the topic rating-event write (the last write inside the
    // transaction) to throw, simulating a crash/exception after the answer
    // and word-rating writes have already been issued but before the
    // transaction commits. The word_bank rating event is written first (see
    // savePracticeAnswer's write order), so the first `.add()` call is
    // allowed through and the second (topic) is made to throw.
    const originalAdd = db.srsRatingEvents.add.bind(db.srsRatingEvents)
    let callCount = 0
    const addSpy = vi.spyOn(db.srsRatingEvents, 'add').mockImplementation((record, key) => {
      callCount++
      if (callCount === 2) {
        return Promise.reject(new Error('simulated crash mid-transaction')) as ReturnType<typeof originalAdd>
      }
      return originalAdd(record, key)
    })

    await expect(savePracticeAnswer('user-1', baseAnswer)).rejects.toThrow('simulated crash mid-transaction')

    // Nothing committed: not the answer_history enqueue, not the word rating
    // event/enqueue, not the topic rating event/enqueue. Full rollback.
    const outboxEntries = await db.syncOutbox.where('userId').equals('user-1').toArray()
    expect(outboxEntries).toHaveLength(0)

    const ratingEvents = await db.srsRatingEvents.where('userId').equals('user-1').toArray()
    expect(ratingEvents).toHaveLength(0)

    addSpy.mockRestore()
  })
})
