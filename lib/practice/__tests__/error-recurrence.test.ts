import { describe, it, expect } from 'vitest'
import {
  recordErrorPattern,
  duePatterns,
  markPatternRehearsed,
  RECURRENCE_INTERVALS_DAYS,
  type ErrorRecurrenceQueue,
} from '@/lib/practice/error-recurrence'

const T0 = new Date('2026-08-24T10:00:00.000Z').getTime()
const DAY = 86_400_000

const empty: ErrorRecurrenceQueue = { entries: [] }

describe('recordErrorPattern', () => {
  it('schedules a new pattern one day out', () => {
    const q = recordErrorPattern(empty, 'tense_present_for_past', T0)
    expect(q.entries).toHaveLength(1)
    expect(q.entries[0]!.stage).toBe(0)
    expect(q.entries[0]!.dueAt).toBe(T0 + RECURRENCE_INTERVALS_DAYS[0]! * DAY)
  })

  it('uses 1, 3 and 7 day intervals', () => {
    expect(RECURRENCE_INTERVALS_DAYS).toEqual([1, 3, 7])
  })

  it('resets an existing pattern to stage 0 when it fails again', () => {
    let q = recordErrorPattern(empty, 'word_order', T0)
    q = markPatternRehearsed(q, 'word_order', true, T0 + DAY)   // advance to stage 1
    q = recordErrorPattern(q, 'word_order', T0 + 2 * DAY)       // fails again
    expect(q.entries).toHaveLength(1)
    expect(q.entries[0]!.stage).toBe(0)
    expect(q.entries[0]!.failCount).toBe(2)
  })

  it('keeps distinct patterns separate', () => {
    let q = recordErrorPattern(empty, 'word_order', T0)
    q = recordErrorPattern(q, 'article_use', T0)
    expect(q.entries).toHaveLength(2)
  })
})

describe('duePatterns', () => {
  it('returns nothing before the due date', () => {
    const q = recordErrorPattern(empty, 'word_order', T0)
    expect(duePatterns(q, T0 + DAY / 2)).toEqual([])
  })

  it('returns the pattern once due', () => {
    const q = recordErrorPattern(empty, 'word_order', T0)
    expect(duePatterns(q, T0 + DAY + 1000)).toEqual(['word_order'])
  })

  it('orders the most-failed pattern first', () => {
    let q = recordErrorPattern(empty, 'article_use', T0)
    q = recordErrorPattern(q, 'word_order', T0)
    q = recordErrorPattern(q, 'word_order', T0) // failed twice
    const due = duePatterns(q, T0 + 2 * DAY)
    expect(due[0]).toBe('word_order')
  })

  it('caps the number returned', () => {
    let q = empty
    for (const id of ['word_order', 'article_use', 'spelling', 'modal_form'] as const) {
      q = recordErrorPattern(q, id, T0)
    }
    expect(duePatterns(q, T0 + 2 * DAY, 2)).toHaveLength(2)
  })
})

describe('markPatternRehearsed', () => {
  it('advances the stage on success', () => {
    let q = recordErrorPattern(empty, 'word_order', T0)
    q = markPatternRehearsed(q, 'word_order', true, T0 + DAY)
    expect(q.entries[0]!.stage).toBe(1)
    expect(q.entries[0]!.dueAt).toBe(T0 + DAY + RECURRENCE_INTERVALS_DAYS[1]! * DAY)
  })

  it('retires the pattern after the final stage', () => {
    let q = recordErrorPattern(empty, 'word_order', T0)
    q = markPatternRehearsed(q, 'word_order', true, T0 + DAY)      // stage 1
    q = markPatternRehearsed(q, 'word_order', true, T0 + 4 * DAY)  // stage 2
    q = markPatternRehearsed(q, 'word_order', true, T0 + 11 * DAY) // retired
    expect(q.entries).toHaveLength(0)
  })

  it('sends the pattern back to stage 0 on failure', () => {
    let q = recordErrorPattern(empty, 'word_order', T0)
    q = markPatternRehearsed(q, 'word_order', true, T0 + DAY)
    q = markPatternRehearsed(q, 'word_order', false, T0 + 4 * DAY)
    expect(q.entries[0]!.stage).toBe(0)
  })

  it('ignores a pattern that is not queued', () => {
    expect(markPatternRehearsed(empty, 'word_order', true, T0)).toEqual(empty)
  })
})
