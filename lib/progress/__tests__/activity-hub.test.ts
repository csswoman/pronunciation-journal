import { describe, expect, it } from 'vitest'
import { buildSessionTelemetry } from '@/lib/progress/activity-hub'
import { buildSessionResult } from '@/lib/practice/session-result'
import type { ExerciseResult } from '@/lib/practice/types'

describe('buildSessionTelemetry', () => {
  it('normalizes a mixed session into summary, answers, skills, and reconciled steps', () => {
    const completedAt = new Date('2026-06-21T12:00:00Z')
    const results: ExerciseResult[] = [
      {
        exerciseId: 'listen-1',
        slug: 'dictation',
        exerciseTypeId: 4,
        isCorrect: true,
        timeMs: 1200,
        contentId: 'word-a',
        context: 'practice',
        completedAt,
      },
      {
        exerciseId: 'speak-1',
        slug: 'speak_word',
        exerciseTypeId: 10,
        isCorrect: false,
        score: 80,
        timeMs: 800,
        contentId: 'word-b',
        context: 'practice',
        completedAt,
      },
    ]

    const telemetry = buildSessionTelemetry(
      'user-1',
      {
        practiceContext: 'practice',
        source: 'lexicon',
        sessionResult: buildSessionResult(results),
        dailyPlanSteps: [{
          kind: 'word_review',
          id: 'word-review',
          title: 'Review',
          subtitle: 'Words',
          icon: 'Book',
          exercises: results.map((result) => ({
            id: result.exerciseId,
            slug: result.slug,
            exerciseTypeId: result.exerciseTypeId,
            contentId: result.contentId,
            context: 'daily',
            payload: { kind: 'generic', data: {} as never },
          })),
          estMinutes: 3,
        }],
      },
      { id: 'session-1', completedAt },
    )

    expect(telemetry.activitySession).toMatchObject({
      id: 'session-1',
      source: 'lexicon',
      exercises_total: 2,
      exercises_correct: 1,
      accuracy_pct: 50,
      duration_ms: 2000,
    })
    expect(telemetry.activitySession.xp_earned).toBeGreaterThan(0)
    expect(telemetry.skillTags).toEqual(expect.arrayContaining(['listening', 'speaking']))
    expect(telemetry.reconciledStepIds).toContain('word-review')
    expect(telemetry.answers).toHaveLength(2)
  })
})
