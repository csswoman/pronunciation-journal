// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { db } from '@/lib/db'
import { saveCachedDailyPlan } from '@/lib/daily/plan-storage'
import { LEARNING_CHUNKS } from '@/lib/chunk-of-day/catalog'
import { buildChunkExercises } from '@/lib/chunk-of-day/exercises'
import type { DailyStep } from '@/lib/practice/types'
import { useSessionState } from '../useSessionState'

/**
 * PracticeSession runtime exit: real chunk exercises through the hook's public
 * submit API into the real answer, chunk SRS and activity writers. Auth, voice
 * rotation, UI cues and the network flush are the only replaced seams.
 */
const USER = '00000000-0000-4000-8000-000000000129'

vi.mock('@/components/auth/AuthProvider', () => ({ useAuth: () => ({ user: { id: USER } }) }))
vi.mock('@/hooks/useVoiceRotation', () => ({ useVoiceRotation: () => ({ currentVoice: 'a', nextVoice: vi.fn() }) }))
vi.mock('@/lib/ui-sounds/cues', () => ({ playUiCue: vi.fn() }))
vi.mock('@/lib/sync/sync-manager', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/lib/sync/sync-manager')>(),
  flushOutbox: vi.fn().mockResolvedValue({ synced: 0, failed: 0, skipped: 0, operations: [] }),
}))

const [chunkA, chunkB] = LEARNING_CHUNKS.filter((chunk) => chunk.learning.cefr === 'A1')
const exercisesFor = (chunk: typeof chunkA) => buildChunkExercises([chunk], LEARNING_CHUNKS, 'practice', 'A1')
  .filter((exercise) => exercise.sourceRef?.source === 'chunks')

function chunkStep(chunk: typeof chunkA): DailyStep {
  return {
    id: `review_chunks:${chunk.id}`, kind: 'chunk_review', title: chunk.chunk, subtitle: 'fixture',
    icon: 'Book', estMinutes: 2, exercises: exercisesFor(chunk),
  }
}

async function outbox(table: string) {
  return (await db.syncOutbox.where('userId').equals(USER).toArray()).filter((entry) => entry.table === table)
}

beforeEach(async () => {
  window.localStorage.clear()
  db.close()
  await db.delete()
  await db.open()
})

afterEach(() => db.close())

describe('PracticeSession → chunk evidence round-trip', { timeout: 20_000 }, () => {
  it('writes answers, canonical chunk SRS and reconciles only the practised chunk step', async () => {
    saveCachedDailyPlan(USER, { steps: [chunkStep(chunkA), chunkStep(chunkB)], totalExercises: 0, isNewUser: false })
    const [recognition, second] = exercisesFor(chunkA)
    const onSessionComplete = vi.fn()
    const { result } = renderHook(() => useSessionState({
      context: 'practice', exercises: [recognition, second], onSessionComplete,
    }))
    await waitFor(() => expect(result.current.phase).toBe('exercising'))

    await act(async () => { await result.current.handleSubmit(true, chunkA.chunk) })
    await waitFor(() => expect(result.current.phase).toBe('exercising'), { timeout: 5_000 })
    await act(async () => { await result.current.handleSubmit(false, 'skip') })
    await waitFor(async () => expect(await outbox('activity_sessions')).toHaveLength(1), { timeout: 5_000 })

    const answers = (await outbox('answer_history')).map((entry) => entry.payload)
    expect(answers).toEqual([
      expect.objectContaining({ user_id: USER, context: 'practice', is_correct: true, exercise_payload: expect.objectContaining({
        attribution: { srsEligible: true, outcomes: [expect.objectContaining({ target: { namespace: 'chunks', id: chunkA.id }, correct: true })] },
      }) }),
      expect.objectContaining({ user_id: USER, is_correct: false, grade: null }),
    ])
    expect((await outbox('content_srs')).map((entry) => entry.payload)).toEqual([
      expect.objectContaining({ user_id: USER, namespace: 'chunks', content_id: chunkA.id }),
    ])
    expect(await db.srsData.where('wordId').equals(`chunk:${chunkA.id}`).count()).toBe(1)
    expect((await outbox('activity_sessions'))[0]?.payload).toMatchObject({
      user_id: USER, exercises_total: 2, exercises_correct: 1, reconciled_step_ids: [`review_chunks:${chunkA.id}`],
    })
    expect(onSessionComplete).toHaveBeenCalledOnce()
  })

  it('a skipped-only session writes no chunk SRS and resolves no step', async () => {
    saveCachedDailyPlan(USER, { steps: [chunkStep(chunkA)], totalExercises: 0, isNewUser: false })
    const { result } = renderHook(() => useSessionState({
      context: 'practice', exercises: [exercisesFor(chunkA)[0]], onSessionComplete: vi.fn(),
    }))
    await waitFor(() => expect(result.current.phase).toBe('exercising'))

    await act(async () => { await result.current.handleSubmit(false, 'skip') })
    await waitFor(async () => expect(await outbox('activity_sessions')).toHaveLength(1), { timeout: 5_000 })

    expect(await outbox('content_srs')).toEqual([])
    expect((await outbox('activity_sessions'))[0]?.payload).toMatchObject({ reconciled_step_ids: [] })
  })
})
