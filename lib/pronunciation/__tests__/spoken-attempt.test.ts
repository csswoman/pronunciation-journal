import { describe, it, expect } from 'vitest'
import {
  isScorableAttempt,
  accuracyFromAttempt,
  type SpokenAttempt,
} from '../spoken-attempt'

function makeAttempt(overrides: Partial<SpokenAttempt> = {}): SpokenAttempt {
  return {
    userId: 'user-1',
    targetText: 'hello world',
    transcript: 'hello world',
    evaluatorVersion: 'stt-v1',
    scoreKind: 'stt_intelligibility',
    overallScore: 100,
    durationMs: 1200,
    outcome: 'scored',
    ...overrides,
  }
}

describe('isScorableAttempt', () => {
  it('returns true only for outcome === "scored"', () => {
    expect(isScorableAttempt(makeAttempt({ outcome: 'scored' }))).toBe(true)
    expect(isScorableAttempt(makeAttempt({ outcome: 'unscored' }))).toBe(false)
    expect(isScorableAttempt(makeAttempt({ outcome: 'skipped' }))).toBe(false)
    expect(isScorableAttempt(makeAttempt({ outcome: 'failed' }))).toBe(false)
  })
})

describe('accuracyFromAttempt', () => {
  it('returns the overall score for a scored attempt', () => {
    expect(accuracyFromAttempt(makeAttempt({ outcome: 'scored', overallScore: 87 }))).toBe(87)
  })

  it('returns null for an unscored attempt (excluded, not 0% or 100%)', () => {
    const result = accuracyFromAttempt(
      makeAttempt({ outcome: 'unscored', overallScore: 0 })
    )
    expect(result).toBeNull()
    expect(result).not.toBe(0)
    expect(result).not.toBe(100)
  })

  it('returns null for a skipped attempt (excluded, not 0% or 100%)', () => {
    const result = accuracyFromAttempt(
      makeAttempt({ outcome: 'skipped', overallScore: 100 })
    )
    expect(result).toBeNull()
    expect(result).not.toBe(0)
    expect(result).not.toBe(100)
  })

  it('returns null for a failed attempt (does not silently count as a pass or 100%)', () => {
    const result = accuracyFromAttempt(
      makeAttempt({ outcome: 'failed', overallScore: 100 })
    )
    expect(result).toBeNull()
    expect(result).not.toBe(0)
    expect(result).not.toBe(100)
  })
})

describe('aggregate accuracy over a mixed batch of attempts', () => {
  it('excludes unscored/skipped/failed attempts from the average entirely', () => {
    const attempts: SpokenAttempt[] = [
      makeAttempt({ outcome: 'scored', overallScore: 100 }),
      makeAttempt({ outcome: 'scored', overallScore: 0 }),
      makeAttempt({ outcome: 'unscored', overallScore: 999 }),
      makeAttempt({ outcome: 'skipped', overallScore: 999 }),
      makeAttempt({ outcome: 'failed', overallScore: 999 }),
    ]

    const scores = attempts
      .map(accuracyFromAttempt)
      .filter((s): s is number => s !== null)

    // Only the two "scored" attempts should contribute.
    expect(scores).toEqual([100, 0])
    expect(scores.length).toBe(2)

    const average = scores.reduce((a, b) => a + b, 0) / scores.length
    expect(average).toBe(50)
  })
})

describe('mastery promotion guard', () => {
  it('only scored attempts are eligible to signal mastery promotion', () => {
    const attempts: SpokenAttempt[] = [
      makeAttempt({ outcome: 'scored' }),
      makeAttempt({ outcome: 'unscored' }),
      makeAttempt({ outcome: 'skipped' }),
      makeAttempt({ outcome: 'failed' }),
    ]

    const eligible = attempts.filter(isScorableAttempt)
    expect(eligible).toHaveLength(1)
    expect(eligible[0].outcome).toBe('scored')
  })
})
