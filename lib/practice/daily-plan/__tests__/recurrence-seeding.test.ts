import { describe, it, expect } from 'vitest'
import { constraintIdsForDuePatterns } from '@/lib/practice/daily-plan/composer'
import { recordErrorPattern, EMPTY_RECURRENCE_QUEUE } from '@/lib/practice/error-recurrence'

const T0 = new Date('2026-08-24T10:00:00.000Z').getTime()
const DAY = 86_400_000

describe('constraintIdsForDuePatterns', () => {
  it('returns the repair drills for due patterns', () => {
    const queue = recordErrorPattern(
      EMPTY_RECURRENCE_QUEUE, 'tense_present_for_past', T0,
    )
    expect(constraintIdsForDuePatterns(queue, T0 + 2 * DAY))
      .toContain('past_simple_narrative')
  })

  it('returns nothing before anything is due', () => {
    const queue = recordErrorPattern(EMPTY_RECURRENCE_QUEUE, 'word_order', T0)
    expect(constraintIdsForDuePatterns(queue, T0)).toEqual([])
  })

  it('skips patterns with no repair drill', () => {
    const queue = recordErrorPattern(EMPTY_RECURRENCE_QUEUE, 'spelling', T0)
    expect(constraintIdsForDuePatterns(queue, T0 + 2 * DAY)).toEqual([])
  })

  it('handles a missing queue', () => {
    expect(constraintIdsForDuePatterns(undefined, T0)).toEqual([])
  })
})
