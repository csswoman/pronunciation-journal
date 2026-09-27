import { describe, expect, it } from 'vitest'
import {
  isEvaluatedHistoryRow,
  isEvaluatedPracticeAnswer,
} from '@/lib/practice/evaluation-status'

describe('progress evaluation eligibility', () => {
  it.each([
    ['answered', 0, 'wrong', true],
    ['skipped', null, 'skip', false],
    ['unscored', null, 'self-assessment', false],
    ['evaluator_failed', null, 'answer', false],
    [undefined, 0, 'legacy wrong answer', true],
    [undefined, 5, 'skip', false],
  ] as const)('classifies persisted status %s with grade %s', (status, grade, userAnswer, expected) => {
    expect(isEvaluatedHistoryRow({
      grade,
      user_answer: userAnswer,
      exercise_payload: status ? { status } : {},
    })).toBe(expected)
  })

  it('uses the same status contract for in-memory session results', () => {
    expect(isEvaluatedPracticeAnswer({ status: 'answered', userAnswer: 'answer' })).toBe(true)
    expect(isEvaluatedPracticeAnswer({ status: 'skipped', userAnswer: 'skip' })).toBe(false)
    expect(isEvaluatedPracticeAnswer({ status: 'unscored', userAnswer: 'answer' })).toBe(false)
    expect(isEvaluatedPracticeAnswer({ status: 'evaluator_failed', userAnswer: 'answer' })).toBe(false)
    expect(isEvaluatedPracticeAnswer({ status: undefined, userAnswer: 'legacy' })).toBe(true)
  })
})
