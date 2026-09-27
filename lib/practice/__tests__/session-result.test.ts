import { describe, expect, it } from 'vitest'
import { buildSessionResult } from '@/lib/practice/session-result'
import type { ExerciseResult, PracticeResultStatus } from '@/lib/practice/types'

function result(status: PracticeResultStatus | undefined, isCorrect: boolean, userAnswer = 'answer'): ExerciseResult {
  return {
    attemptId: crypto.randomUUID(),
    exerciseId: crypto.randomUUID(),
    slug: 'fill_blank',
    exerciseTypeId: 5,
    isCorrect,
    userAnswer,
    timeMs: 100,
    status,
    contentId: 'content-1',
    context: 'practice',
    completedAt: new Date(),
  }
}

describe('buildSessionResult', () => {
  it('uses the same evaluable denominator for complete and partial summaries', () => {
    const summary = buildSessionResult([
      result('answered', true),
      result('answered', false),
      result('skipped', false, 'skip'),
      result('unscored', true),
      result('evaluator_failed', true),
    ])

    expect(summary.evaluatedTotal).toBe(2)
    expect(summary.accuracy).toBe(50)
    expect(summary.bySlug.fill_blank).toEqual({ total: 2, correct: 1 })
  })

  it('keeps legacy non-skip results evaluable', () => {
    const summary = buildSessionResult([
      result(undefined, false),
      result(undefined, false, 'skip'),
    ])

    expect(summary.evaluatedTotal).toBe(1)
    expect(summary.accuracy).toBe(0)
  })
})
