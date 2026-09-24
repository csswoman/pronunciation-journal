// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
vi.mock('@/lib/sync/sync-manager', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/lib/sync/sync-manager')>(),
  flushOutbox: vi.fn().mockResolvedValue({ synced: 0, failed: 0, skipped: 0 }),
}))
import { db } from '@/lib/db'
import { saveCachedDailyPlan, loadResolvedIds } from '@/lib/daily/plan-storage'
import { recordLessonQuizAttempt, type LessonQuizAnswerInput } from '@/lib/practice/queries'
import { recordImmersionQuizAttempt } from '@/lib/immersion/progress-queries'
import { persistMissionSession } from '@/lib/ai-practice/missions/persistence'
import { createMissionState, missionReducer } from '@/lib/ai-practice/missions/state-machine'
import { deriveMissionOutcome } from '@/lib/ai-practice/missions/outcome'
import { getMission } from '@/lib/ai-practice/missions/registry'
import { parseMissionLaunch } from '@/lib/ai-practice/missions/launch'
import type { ConversationalMission } from '@/lib/ai-practice/missions/types'
import type { SpokenAttempt } from '@/lib/pronunciation/spoken-attempt'
import type { DailyStep } from '@/lib/practice/types'

/**
 * Producer → real writers → outbox. Only the network flush is replaced; every
 * answer, activity and domain writer below is the production implementation.
 */
const USER = '00000000-0000-4000-8000-000000000127'

function step(id: string, kind: DailyStep['kind']): DailyStep {
  return { id, kind, title: id, subtitle: 'Producer fixture', icon: 'Book', exercises: [], estMinutes: 2 }
}

function cachePlan(steps: DailyStep[]) {
  saveCachedDailyPlan(USER, { steps, totalExercises: 0, isNewUser: false })
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

describe('course quiz producer', () => {
  const quiz = (questionId: string, isCorrect: boolean, attemptId?: string): LessonQuizAnswerInput => ({
    attemptId,
    questionId, courseSlug: 'a1', lessonSlug: 'a1-presente-simple', question: 'She ___ here.',
    selectedAnswer: isCorrect ? 'works' : 'work', correctAnswer: 'works', isCorrect, timeMs: 800, topic: 'present simple',
  })

  it('writes each answer and reconciles only the exact study deck', async () => {
    cachePlan([step('study_deck:a1:a1-presente-simple', 'study_deck'), step('study_deck:a1:a1-verbo-to-be', 'study_deck')])

    const outcome = await recordLessonQuizAttempt(USER, [quiz('q1', true), quiz('q2', false)])

    expect(outcome).toEqual({ passed: false, correct: 1, total: 2 })
    const answers = await outbox('answer_history')
    expect(answers.map((entry) => entry.payload)).toEqual(expect.arrayContaining([
      expect.objectContaining({ user_id: USER, context: 'courses', content_id: 'a1:a1-presente-simple:q1', is_correct: true }),
      expect.objectContaining({ user_id: USER, context: 'courses', content_id: 'a1:a1-presente-simple:q2', is_correct: false }),
    ]))
    const [activity] = await outbox('activity_sessions')
    expect(activity?.payload).toMatchObject({ source: 'courses', exercises_total: 2, reconciled_step_ids: ['study_deck:a1:a1-presente-simple'] })
    expect([...loadResolvedIds(USER)]).toEqual(['study_deck:a1:a1-presente-simple'])
  })

  it('accepts a retried submission as replay-safe with stable attemptId', async () => {
    const attempt = [quiz('q1', true, 'quiz-attempt-1:q1')]
    await recordLessonQuizAttempt(USER, attempt, { attemptId: 'quiz-attempt-1' })
    await recordLessonQuizAttempt(USER, attempt, { attemptId: 'quiz-attempt-1' })
    expect(await outbox('answer_history')).toHaveLength(1)
    expect(await outbox('activity_sessions')).toHaveLength(1)
  })

  it('opening a lesson without answering writes no evidence and resolves nothing', async () => {
    cachePlan([step('study_deck:a1:a1-presente-simple', 'study_deck')])
    await recordLessonQuizAttempt(USER, [])
    expect(await db.syncOutbox.where('userId').equals(USER).count()).toBe(0)
    expect(loadResolvedIds(USER).size).toBe(0)
  })
})

describe('immersion quiz producer', () => {
  const attempt = (lessonId: string) => ({
    attemptId: `immersion-${lessonId}`, lessonId, canonicalTopic: 'present simple',
    answers: [{ questionId: 'q1', question: 'Meaning?', selectedAnswer: 'A', correctAnswer: 'A', isCorrect: true, timeMs: 900 }],
  })

  it('reconciles the exact immersion lesson step in the same activity row', async () => {
    cachePlan([step('immersion_lesson:lesson-1', 'immersion_lesson'), step('immersion_lesson:lesson-2', 'immersion_lesson')])

    await recordImmersionQuizAttempt(USER, attempt('lesson-1'))
    await recordImmersionQuizAttempt(USER, attempt('lesson-1'))

    expect(await outbox('answer_history')).toHaveLength(1)
    const activities = await outbox('activity_sessions')
    expect(activities).toHaveLength(1)
    expect(activities[0]?.payload).toMatchObject({
      id: 'immersion-lesson-1', source: 'immersion', reconciled_step_ids: ['immersion_lesson:lesson-1'],
    })
  })
})

describe('oral mission producer', () => {
  const mission = getMission('roleplay.cafe') as ConversationalMission
  const spoken = (outcome: SpokenAttempt['outcome'], overallScore: number): SpokenAttempt => ({
    userId: USER, targetText: mission.targets[0].phrase, transcript: "i'd like a medium latte please",
    evaluatorVersion: 'stt-v1', scoreKind: 'stt_intelligibility', overallScore,
    targetId: mission.targets[0].targetId, durationMs: 2_000, outcome,
  })

  function playMission(attempts: SpokenAttempt[]) {
    let state = createMissionState(mission.id)
    for (const intent of mission.requiredIntents) {
      state = missionReducer(state, { type: 'intent_observed', intentId: intent.id }, mission)
    }
    for (const attempt of attempts) state = missionReducer(state, { type: 'turn_spoken', attempt }, mission)
    while (state.status === 'in_progress') state = missionReducer(state, { type: 'turn_text' }, mission)
    return state
  }

  it('writes scored turns, owner evidence and the canonical launch step from reducer events', async () => {
    const launch = parseMissionLaunch({
      launchId: 'daily-launch-127', missionId: mission.id, targetIds: [mission.targets[0].targetId],
      source: 'daily', stepId: 'mission:roleplay.cafe',
    })
    const state = playMission([spoken('scored', 88), spoken('unscored', 0)])
    expect(state.status).toBe('completed')

    await persistMissionSession(USER, mission, state, deriveMissionOutcome(state, mission), launch)
    await persistMissionSession(USER, mission, state, deriveMissionOutcome(state, mission), launch)

    const answers = await outbox('answer_history')
    expect(answers.map((entry) => entry.payload.id)).toEqual(['daily-launch-127:spoken:0'])
    expect(await outbox('pronunciation_feedback_evidence')).toEqual([
      expect.objectContaining({ payload: expect.objectContaining({ user_id: USER, target_id: mission.targets[0].targetId }) }),
    ])
    const activities = await outbox('activity_sessions')
    expect(activities).toHaveLength(1)
    expect(activities[0]?.payload).toMatchObject({
      id: 'mission-activity:daily-launch-127', exercises_total: 1, reconciled_step_ids: ['mission:roleplay.cafe'],
    })
  })

  it('an unscored-only mission keeps activity but writes no answer, evidence or reconciliation', async () => {
    const launch = parseMissionLaunch({
      launchId: 'daily-launch-unscored', missionId: mission.id, targetIds: [mission.targets[0].targetId],
      source: 'daily', stepId: 'mission:roleplay.cafe',
    })
    const state = playMission([spoken('unscored', 0)])

    await persistMissionSession(USER, mission, state, deriveMissionOutcome(state, mission), launch)

    expect(await outbox('answer_history')).toEqual([])
    expect(await outbox('pronunciation_feedback_evidence')).toEqual([])
    expect((await outbox('activity_sessions'))[0]?.payload).toMatchObject({ exercises_total: 0, reconciled_step_ids: [] })
  })
})
