// @vitest-environment node
import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
vi.mock('@/lib/sync/sync-manager', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/lib/sync/sync-manager')>(),
  flushOutbox: vi.fn().mockResolvedValue({ synced: 0, failed: 0, skipped: 0 }),
}))
import { db } from '@/lib/db'
import { topicId, type EvidenceAttribution } from '@/lib/practice/attribution'
import { candidate, selectDailyCandidates } from '@/lib/practice/daily-plan/policy'
import { savePracticeAnswer } from '@/lib/practice/queries'
import type {
  DailySelectionReason,
  DailyStep,
  ExerciseResult,
  PracticeAnswer,
  SessionResult,
} from '@/lib/practice/types'
import { recordActivitySession } from '@/lib/progress/activity-hub'
import { recordGameActivity } from '@/lib/progress/game-activity'
import { recordImmersionQuizAttempt } from '@/lib/immersion/progress-queries'
import { completeReader } from '@/lib/practice/reader/complete-reader'
import { projectProgress, type ProgressFact } from '@/lib/progress/projections'

const USER = '00000000-0000-4000-8000-000000000076'
const TOPIC = 'grammar:present simple'
const TARGET = `topic:${TOPIC}`
const STARTED_AT = '2026-08-11T15:00:00.000Z'

function dailyStep(
  id: string,
  reason: DailySelectionReason,
  targetRef: string,
): ReturnType<typeof candidate> {
  const step: DailyStep = {
    id,
    kind: id.startsWith('study_deck:') ? 'study_deck' : 'word_review',
    title: id,
    subtitle: 'Acceptance fixture',
    icon: 'Book',
    exercises: [],
    estMinutes: 2,
  }
  return candidate(step, { reason, targetRefs: [targetRef], source: 'roundtrip-fixture' })
}

function answer(attemptId: string, isCorrect: boolean): PracticeAnswer {
  return {
    attemptId,
    exerciseId: `exercise-${attemptId}`,
    slug: 'error_correction',
    exerciseTypeId: 19,
    isCorrect,
    userAnswer: isCorrect ? 'She works here.' : 'She work here.',
    timeMs: 1_500,
    contentId: 'a1:present-simple:quiz:1',
    context: 'courses',
    topic: TOPIC,
    attribution: {
      srsEligible: true,
      outcomes: [{
        target: { namespace: 'topic', id: topicId(TOPIC) },
        correct: isCorrect,
        modality: 'contextual_use',
      }],
    },
  }
}

function result(value: PracticeAnswer, completedAt: string): ExerciseResult {
  return { ...value, completedAt: new Date(completedAt) }
}

function session(results: ExerciseResult[]): SessionResult {
  const correct = results.filter((entry) => entry.isCorrect).length
  return {
    results,
    accuracy: results.length === 0 ? 0 : (correct / results.length) * 100,
    totalTimeMs: results.reduce((total, entry) => total + entry.timeMs, 0),
    bySlug: {
      error_correction: { total: results.length, correct },
    } as SessionResult['bySlug'],
  }
}

function answerFact(payload: Record<string, unknown>, occurredAt: string): ProgressFact {
  const exercisePayload = payload.exercise_payload as {
    attribution: EvidenceAttribution
  }
  if (!exercisePayload.attribution.srsEligible) {
    throw new Error('Round-trip fixture requires objective evidence')
  }
  const [outcome] = exercisePayload.attribution.outcomes
  return {
    id: String(payload.id),
    signal: 'objective_evidence',
    occurredAt,
    targetId: `${outcome.target.namespace}:${outcome.target.id}`,
    correct: outcome.correct,
    provenance: 'answer_history',
    modality: outcome.modality,
  }
}

describe('integrated learning-loop local round-trip', () => {
  beforeEach(async () => {
    db.close()
    await db.delete()
    await db.open()
  })

  afterEach(() => db.close())

  it('keeps selection, writers, reconciliation, and progress projections exact', async () => {
    const selected = selectDailyCandidates([
      dailyStep('saved:present-simple', 'saved_intent', TARGET),
      dailyStep('study_deck:a1:present-simple', 'route_next', TARGET),
      dailyStep('word_review', 'due', 'core1k:hello'),
    ], { limit: 3 })

    expect(selected.map((step) => [step.id, step.selection?.reason])).toEqual([
      ['word_review', 'due'],
      ['study_deck:a1:present-simple', 'route_next'],
    ])

    const accepted = answer('answer-accepted', true)
    await savePracticeAnswer(USER, accepted)
    await savePracticeAnswer(USER, accepted)

    let outbox = await db.syncOutbox.where('userId').equals(USER).toArray()
    let answerWrites = outbox.filter((entry) => entry.table === 'answer_history')
    expect(answerWrites).toHaveLength(1)
    expect(answerWrites[0]?.payload).toMatchObject({
      id: 'answer-accepted',
      user_id: USER,
      is_correct: true,
      topic: TOPIC,
      context: 'courses',
      exercise_payload: {
        attributionVersion: 1,
        attribution: {
          srsEligible: true,
          outcomes: [{
            target: { namespace: 'topic', id: TOPIC },
            correct: true,
            modality: 'contextual_use',
          }],
        },
      },
    })

    const completedSession = session([result(accepted, STARTED_AT)])
    await recordActivitySession(USER, {
      activitySessionId: 'activity-session-1',
      practiceContext: 'courses',
      sessionResult: completedSession,
      dailyPlanSteps: selected,
      metadata: { dailyTargetId: 'a1:present-simple' },
    })

    outbox = await db.syncOutbox.where('userId').equals(USER).toArray()
    const activityWrites = outbox.filter((entry) => entry.table === 'activity_sessions')
    expect(activityWrites).toHaveLength(1)
    expect(activityWrites[0]?.payload).toMatchObject({
      id: 'activity-session-1',
      exercises_total: 1,
      reconciled_step_ids: ['study_deck:a1:present-simple'],
    })

    const acceptedFact = answerFact(answerWrites[0]!.payload, STARTED_AT)
    const activityFact: ProgressFact = {
      id: 'activity-session-1',
      signal: 'objective_evidence',
      occurredAt: STARTED_AT,
      exercises: 1,
      durationMs: 1_500,
      provenance: 'activity_sessions',
    }
    const initial = projectProgress([acceptedFact, activityFact])
    expect(initial.activity).toEqual({ sessions: 1, exercises: 1, durationMs: 1_500, activeDays: 1 })
    expect(initial.learning).toMatchObject({ evidencedTargets: 1, reviewTargets: 0 })
    expect(initial.learning.evidence).toEqual([
      expect.objectContaining({
        id: 'answer-accepted',
        targetId: TARGET,
        correct: true,
        provenance: 'answer_history',
        modality: 'contextual_use',
      }),
    ])

    const nonLearningFacts: ProgressFact[] = [
      { id: 'lesson:present-simple', signal: 'completion', occurredAt: STARTED_AT, provenance: 'lesson_completions' },
      { id: 'saved:present-simple', signal: 'intent', occurredAt: STARTED_AT, provenance: 'tracked_items' },
    ]
    const withCoverageAndIntent = projectProgress([acceptedFact, activityFact, ...nonLearningFacts])
    expect(withCoverageAndIntent.coverage).toEqual({ encountered: 1, completed: 1 })
    expect(withCoverageAndIntent.learning).toEqual(initial.learning)

    const failed = answer('answer-failed-later', false)
    await savePracticeAnswer(USER, failed)
    outbox = await db.syncOutbox.where('userId').equals(USER).toArray()
    answerWrites = outbox.filter((entry) => entry.table === 'answer_history')
    expect(answerWrites).toHaveLength(2)
    const failedWrite = answerWrites.find((entry) => entry.payload.id === 'answer-failed-later')
    expect(failedWrite).toBeDefined()

    const afterFailure = projectProgress([
      acceptedFact,
      answerFact(failedWrite!.payload, '2026-08-12T15:00:00.000Z'),
      activityFact,
      ...nonLearningFacts,
    ])
    expect(afterFailure.learning).toMatchObject({ evidencedTargets: 0, reviewTargets: 1 })
    expect(afterFailure.learning.evidence).toEqual([
      expect.objectContaining({ targetId: TARGET, correct: false, modality: 'contextual_use' }),
    ])
  })

  it('isolates replay-safe answers by user and keeps skipped attempts out of learning evidence', async () => {
    const otherUser = '00000000-0000-4000-8000-000000000077'
    const skipped = { ...answer('shared-attempt', true), status: 'skipped' as const, userAnswer: 'skip' }
    await savePracticeAnswer(USER, skipped)
    await savePracticeAnswer(USER, skipped)
    await savePracticeAnswer(otherUser, answer('shared-attempt', true))

    const own = await db.syncOutbox.where('userId').equals(USER).toArray()
    const other = await db.syncOutbox.where('userId').equals(otherUser).toArray()
    expect(own.filter((entry) => entry.table === 'answer_history')).toHaveLength(1)
    expect(other.filter((entry) => entry.table === 'answer_history')).toHaveLength(1)
    expect(own.find((entry) => entry.table === 'answer_history')?.payload).toMatchObject({
      id: 'shared-attempt', user_id: USER, grade: null, is_correct: false,
    })
    expect(other.find((entry) => entry.table === 'answer_history')?.payload)
      .toMatchObject({ id: 'shared-attempt', user_id: otherUser, is_correct: true })

    const selected = [dailyStep('study_deck:a1:present-simple', 'route_next', TARGET).step]
    const outcome = await recordActivitySession(USER, {
      activitySessionId: 'skipped-session',
      practiceContext: 'courses',
      sessionResult: session([result(skipped, STARTED_AT)]),
      dailyPlanSteps: selected,
      metadata: { dailyTargetId: 'a1:present-simple' },
    })
    expect(outcome.reconciledStepIds).toEqual([])
    expect(projectProgress([{ id: 'skipped-session', signal: 'objective_evidence', occurredAt: STARTED_AT, provenance: 'activity_sessions' }]).learning.evidencedTargets).toBe(0)
  })

  it.each(['word_rain', 'word_search'] as const)('records %s activity without answer evidence', async (source) => {
    await recordGameActivity(USER, source, 1_250, `${source}-fixture`)
    const outbox = await db.syncOutbox.where('userId').equals(USER).toArray()
    expect(outbox.filter((entry) => entry.table === 'answer_history')).toEqual([])
    expect(outbox.filter((entry) => entry.table === 'activity_sessions')).toEqual([
      expect.objectContaining({ payload: expect.objectContaining({
        user_id: USER, source, exercises_total: 0, duration_ms: 1_250, reconciled_step_ids: [],
      }) }),
    ])
  })

  it('persists immersion quiz selections once per attempt with stable ids', async () => {
    const attempt = {
      attemptId: 'immersion-attempt-1', lessonId: 'lesson-1', canonicalTopic: TOPIC,
      answers: [{ questionId: 'q1', question: 'Meaning?', selectedAnswer: 'A', correctAnswer: 'A', isCorrect: true, timeMs: 900 }],
    }
    await recordImmersionQuizAttempt(USER, attempt)
    await recordImmersionQuizAttempt(USER, attempt)
    const outbox = await db.syncOutbox.where('userId').equals(USER).toArray()
    expect(outbox.filter((entry) => entry.table === 'answer_history')).toEqual([
      expect.objectContaining({ payload: expect.objectContaining({
        id: 'immersion-attempt-1:q1', user_id: USER, user_answer: 'A',
        exercise_payload: expect.objectContaining({ immersionLessonId: 'lesson-1', questionId: 'q1' }),
      }) }),
    ])
    expect(outbox.filter((entry) => entry.table === 'activity_sessions')).toEqual([
      expect.objectContaining({ payload: expect.objectContaining({
        id: 'immersion-attempt-1', user_id: USER, source: 'immersion', exercises_total: 1,
      }) }),
    ])
  })

  it('persists a completed Reader task but no target mastery from its activity', async () => {
    await completeReader({ userId: USER, passageId: 'passage-1', correct: true, context: 'practice' })
    const outbox = await db.syncOutbox.where('userId').equals(USER).toArray()
    expect(outbox.filter((entry) => entry.table === 'answer_history')).toEqual([
      expect.objectContaining({ payload: expect.objectContaining({
        user_id: USER, content_id: 'passage-1', is_correct: true,
      }) }),
    ])
    expect(outbox.filter((entry) => entry.table === 'activity_sessions')).toEqual([
      expect.objectContaining({ payload: expect.objectContaining({
        user_id: USER, source: 'practice', exercises_total: 1, reconciled_step_ids: [],
      }) }),
    ])
    expect(projectProgress([{ id: 'reader-session', signal: 'objective_evidence', occurredAt: STARTED_AT, provenance: 'activity_sessions' }]).learning.evidencedTargets).toBe(0)
  })
})
