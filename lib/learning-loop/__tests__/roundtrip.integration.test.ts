// @vitest-environment node
import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
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
})
