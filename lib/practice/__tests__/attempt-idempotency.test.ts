import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '@/lib/db'
import { savePracticeAnswer } from '../queries'
import type { PracticeAnswer } from '../types'
import { practiceEffectId } from '../attempt-identity'
import { persistCoachExerciseResult } from '@/lib/ai-practice/coach-progress'
import { flushOutbox } from '@/lib/sync/sync-manager'

const remote = vi.hoisted(() => ({ enabled: false,
  upsert: vi.fn(async () => ({ error: null })), rpc: vi.fn(async () => ({ data: null, error: null })),
}))

vi.mock('@/lib/supabase/client', () => ({
  getSupabaseBrowserClient: () => {
    if (!remote.enabled) throw new Error('offline test')
    return { from: () => ({ upsert: remote.upsert }), rpc: remote.rpc }
  },
}))

const user = 'test-user'
const word = '550e8400-e29b-41d4-a716-446655440000'
const answer: PracticeAnswer = {
  attemptId: 'session:0:exercise', exerciseId: 'exercise', slug: 'fill_blank',
  exerciseTypeId: 5, isCorrect: true, timeMs: 7000, context: 'practice',
  contentId: word, sourceRef: { source: 'word_bank', id: word }, topic: 'grammar:present simple',
}
beforeEach(async () => { remote.enabled = false; vi.clearAllMocks(); db.close(); await db.delete(); await db.open() })
afterEach(() => { vi.restoreAllMocks(); db.close() })

describe('attempt receipt survives transport', () => {
  it('derives valid UUIDs separated by user, entity type, entity id, attempt and effect', async () => {
    const key = await practiceEffectId(user, 'attempt', 'word_bank', word, 'rating')
    expect(key).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-8[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
    expect(await practiceEffectId(user, 'attempt', 'word_bank', word, 'rating')).toBe(key)
    const alternatives = [
      ['other', 'attempt', 'word_bank', word, 'rating'],
      [user, 'next', 'word_bank', word, 'rating'],
      [user, 'attempt', 'topic_srs', word, 'rating'],
      [user, 'attempt', 'word_bank', 'other', 'rating'],
      [user, 'attempt', 'word_bank', word, 'answer'],
    ] as const
    for (const [u, a, ent, id, eff] of alternatives) {
      expect(await practiceEffectId(u, a, ent, id, eff)).not.toBe(key)
    }
  })
  it('concurrent replay enqueues one answer and one event per entity', async () => {
    await Promise.all([savePracticeAnswer(user, answer), savePracticeAnswer(user, answer)])
    expect(await db.srsRatingEvents.count()).toBe(2)
    expect(await db.syncOutbox.count()).toBe(3)
  })
  it('replay after outbox removal produces no new effect; a new attempt does', async () => {
    await savePracticeAnswer(user, answer)
    await db.syncOutbox.clear()
    await savePracticeAnswer(user, answer)
    expect(await db.syncOutbox.count()).toBe(0)
    expect(await db.srsRatingEvents.count()).toBe(2)
    await savePracticeAnswer(user, { ...answer, attemptId: 'new-session:0:exercise' })
    expect(await db.srsRatingEvents.count()).toBe(4)
  })
  it('actual flush followed by database reopen retains the receipt', async () => {
    Object.defineProperty(globalThis, 'navigator', { value: { onLine: true }, configurable: true })
    await savePracticeAnswer(user, answer)
    remote.enabled = true
    expect(await flushOutbox(user)).toMatchObject({ synced: 3, failed: 0 })
    expect(await db.syncOutbox.count()).toBe(0)
    db.close(); await db.open()
    await savePracticeAnswer(user, answer)
    expect(await db.syncOutbox.count()).toBe(0)
    expect(remote.upsert).toHaveBeenCalledOnce()
    expect(remote.rpc).toHaveBeenCalledTimes(2)
  })
  it.each(['chunks', 'text_fragments'] as const)('replays do not reschedule %s', async (source) => {
    const local = { ...answer, topic: undefined, sourceRef: { source, id: 'same-content' } }
    await savePracticeAnswer(user, local)
    const before = await db.srsData.toArray()
    await db.syncOutbox.clear()
    await savePracticeAnswer(user, local)
    expect(await db.srsData.toArray()).toEqual(before)
    expect(await db.syncOutbox.count()).toBe(0)
  })
  it('fifty exact replays do not advance schedules or produce more evidence', async () => {
    const chunk: PracticeAnswer = { ...answer, sourceRef: { source: 'chunks', id: 'chunk' } }
    await savePracticeAnswer(user, chunk)
    const evidence = await db.chunkEvidence.toArray()
    const srs = await db.srsData.toArray()
    await db.syncOutbox.clear()
    for (let i = 0; i < 50; i++) await savePracticeAnswer(user, chunk)
    expect(await db.chunkEvidence.toArray()).toEqual(evidence)
    expect(await db.srsData.toArray()).toEqual(srs)
    expect(await db.syncOutbox.count()).toBe(0)
  })
  it('replays preserve a single recurrence failure and allow a distinct failure', async () => {
    const failure = { ...answer, isCorrect: false, exercisePayload: { errorPattern: 'tense_present_for_past' } }
    await savePracticeAnswer(user, failure)
    const state = await db.learningState.get(user)
    await db.syncOutbox.clear()
    await savePracticeAnswer(user, failure)
    expect(await db.learningState.get(user)).toEqual(state)
    expect(await db.syncOutbox.count()).toBe(0)
    await savePracticeAnswer(user, { ...failure, attemptId: 'another-failure' })
    expect((await db.learningState.get(user))?.state.errorRecurrence?.entries[0].failCount).toBe(2)
  })
  it('a receipt failure rolls back chunk evidence, SRS, recurrence and outbox together', async () => {
    const local: PracticeAnswer = { ...answer, sourceRef: { source: 'chunks', id: 'chunk' },
      exercisePayload: { errorPattern: 'tense_present_for_past' } }
    const failure = vi.spyOn(db.practiceAttemptReceipts, 'add').mockRejectedValueOnce(new Error('receipt failed'))
    await expect(savePracticeAnswer(user, local)).rejects.toThrow('receipt failed')
    expect(await db.syncOutbox.count()).toBe(0)
    expect(await db.srsData.count()).toBe(0)
    expect(await db.chunkEvidence.count()).toBe(0)
    expect(await db.learningState.count()).toBe(0)
    failure.mockRestore()
    await savePracticeAnswer(user, local)
    expect(await db.practiceAttemptReceipts.count()).toBe(1)
  })
  it('Coach widget replay after transport keeps the original failure', async () => {
    const result = { attemptId: 'coach:widget-1', correct: false, topic: 'grammar:present simple', gradedBy: 'client' as const }
    await persistCoachExerciseResult(user, 'render_fill_blank', result)
    const events = await db.srsRatingEvents.toArray()
    await db.syncOutbox.clear()
    await persistCoachExerciseResult(user, 'render_fill_blank', { ...result, correct: true, firstTryFailed: true })
    expect(await db.srsRatingEvents.toArray()).toEqual(events)
    expect(events[0].grade).toBe(1)
    expect(await db.syncOutbox.count()).toBe(0)
  })
})
