// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '@/lib/db'
import { isDailyStepAlreadyRecorded, recordActivitySession, recordDailyStepCompletion } from '@/lib/progress/activity-hub'
import { buildSessionResult } from '@/lib/practice/session-result'
import type { ExerciseResult } from '@/lib/practice/types'

const USER = '00000000-0000-4000-8000-000000000050'
const STEP = 'grammar_focus:3'
const answer: ExerciseResult = {
  exerciseId: 'q1', contentId: 'q1', slug: 'multiple_choice', exerciseTypeId: 17,
  context: 'daily', status: 'answered', isCorrect: true, timeMs: 900, completedAt: new Date(),
}

function recordSession() {
  return recordActivitySession(USER, {
    practiceContext: 'daily',
    activitySessionId: 'daily-session',
    sessionResult: buildSessionResult([answer]),
    explicitReconciledStepIds: [STEP],
  })
}

beforeEach(async () => {
  window.localStorage.clear()
  db.close()
  await db.delete()
  await db.open()
})

afterEach(() => { db.close(); vi.restoreAllMocks() })

describe('Daily reconciliation with the real Dexie outbox', () => {
  it('retains the session and its reconciliation after reopening IndexedDB', async () => {
    await recordSession()
    db.close()
    await db.open()

    const rows = await db.syncOutbox.where('userId').equals(USER).toArray()
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      table: 'activity_sessions', status: 'pending',
      payload: { id: 'daily-session', reconciled_step_ids: [STEP] },
    })
    expect(isDailyStepAlreadyRecorded(USER, STEP)).toBe(true)
  })

  it('preserves the manual fallback when the actual outbox transaction aborts', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const rejectWrite = () => { throw new Error('Simulated storage failure') }
    db.syncOutbox.hook('creating', rejectWrite)
    try {
      await recordSession()
    } finally {
      db.syncOutbox.hook('creating').unsubscribe(rejectWrite)
    }

    expect(await db.syncOutbox.count()).toBe(0)
    expect(isDailyStepAlreadyRecorded(USER, STEP)).toBe(false)
    await recordDailyStepCompletion(USER, STEP)
    db.close()
    await db.open()
    const rows = await db.syncOutbox.where('userId').equals(USER).toArray()
    expect(rows).toHaveLength(1)
    expect(rows[0]?.payload).toMatchObject({ source: 'daily_plan', reconciled_step_ids: [STEP] })
  })
})
