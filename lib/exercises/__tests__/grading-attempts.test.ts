import { describe, expect, it } from 'vitest'
import {
  AI_GRADES_SPENT_MESSAGE,
  AiGradingBlockedError,
  assertAiGradeAllowed,
  isSameAttempt,
  normalizedEditDistance,
  REPEATED_ATTEMPT_MESSAGE,
} from '../grading-attempts'

describe('normalizedEditDistance', () => {
  it('ignores case, punctuation and contractions', () => {
    expect(normalizedEditDistance("I don't work today!", 'i do not work today')).toBe(0)
  })

  it('counts edits between different answers', () => {
    expect(normalizedEditDistance('I go to the park', 'I go to the parks')).toBe(1)
    expect(normalizedEditDistance('I go to the park', 'I went to the garden')).toBeGreaterThanOrEqual(3)
  })
})

describe('isSameAttempt', () => {
  it('treats a barely edited retry as the same answer', () => {
    expect(isSameAttempt('I go to the parks', 'I go to the park')).toBe(true)
    expect(isSameAttempt('I went to the garden', 'I go to the park')).toBe(false)
  })
})

describe('assertAiGradeAllowed', () => {
  const fresh = { lastProduction: null, aiGrades: 0 }

  it('allows the first attempt', () => {
    expect(() => assertAiGradeAllowed('I went to the garden', fresh)).not.toThrow()
  })

  it('blocks when offline', () => {
    try {
      assertAiGradeAllowed('I went to the garden', fresh, false)
      expect.unreachable('should have thrown')
    } catch (cause) {
      expect(cause).toBeInstanceOf(AiGradingBlockedError)
      expect((cause as AiGradingBlockedError).reason).toBe('offline')
    }
  })

  it('blocks a retry that barely changed', () => {
    try {
      assertAiGradeAllowed('I go to the parks', { lastProduction: 'I go to the park', aiGrades: 1 })
      expect.unreachable('should have thrown')
    } catch (cause) {
      expect((cause as AiGradingBlockedError).reason).toBe('repeated')
      expect((cause as Error).message).toBe(REPEATED_ATTEMPT_MESSAGE)
    }
  })

  it('blocks a third graded version of the same exercise', () => {
    try {
      assertAiGradeAllowed('A brand new sentence here', { lastProduction: 'Something else', aiGrades: 2 })
      expect.unreachable('should have thrown')
    } catch (cause) {
      expect((cause as AiGradingBlockedError).reason).toBe('budget-spent')
      expect((cause as Error).message).toBe(AI_GRADES_SPENT_MESSAGE)
    }
  })
})
