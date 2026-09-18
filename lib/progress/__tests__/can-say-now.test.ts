import { describe, it, expect } from 'vitest'
import { buildCanSayNow, type CanSayInput } from '@/lib/progress/can-say-now'

const NOW = new Date('2026-08-24T10:00:00.000Z').getTime()
const DAY = 86_400_000

function attempt(
  constraintId: string,
  isCorrect: boolean,
  daysAgo: number,
  sentence = 'I visited my family last weekend.',
): CanSayInput['attempts'][number] {
  return {
    constraintId,
    isCorrect,
    answeredAt: new Date(NOW - daysAgo * DAY).toISOString(),
    sentence,
  }
}

describe('buildCanSayNow', () => {
  it('lists a structure produced correctly at least twice', () => {
    const result = buildCanSayNow({
      attempts: [
        attempt('past_simple_narrative', true, 5),
        attempt('past_simple_narrative', true, 2),
      ],
    }, NOW)
    expect(result.mastered.map((m) => m.constraintId)).toContain('past_simple_narrative')
  })

  it('does not list a structure produced correctly only once', () => {
    const result = buildCanSayNow({
      attempts: [attempt('past_simple_narrative', true, 2)],
    }, NOW)
    expect(result.mastered).toHaveLength(0)
  })

  it('ignores attempts older than the window', () => {
    const result = buildCanSayNow({
      attempts: [
        attempt('past_simple_narrative', true, 45),
        attempt('past_simple_narrative', true, 40),
      ],
    }, NOW)
    expect(result.mastered).toHaveLength(0)
  })

  it('keeps one example sentence per mastered structure', () => {
    const result = buildCanSayNow({
      attempts: [
        attempt('past_simple_narrative', true, 5, 'I went to Madrid.'),
        attempt('past_simple_narrative', true, 2, 'I bought a new laptop.'),
      ],
    }, NOW)
    expect(result.mastered[0]!.example).toBeTruthy()
  })

  it('lists structures still in progress separately', () => {
    const result = buildCanSayNow({
      attempts: [
        attempt('second_conditional', false, 3),
        attempt('second_conditional', true, 1),
      ],
    }, NOW)
    expect(result.inProgress.map((m) => m.constraintId)).toContain('second_conditional')
    expect(result.mastered.map((m) => m.constraintId)).not.toContain('second_conditional')
  })

  it('returns empty lists with no attempts', () => {
    const result = buildCanSayNow({ attempts: [] }, NOW)
    expect(result.mastered).toEqual([])
    expect(result.inProgress).toEqual([])
  })

  it('classifies two correct attempts 5 minutes apart in inProgress', () => {
    const t1 = new Date(NOW - 5 * 60 * 1000).toISOString()
    const t2 = new Date(NOW).toISOString()
    const result = buildCanSayNow(
      {
        attempts: [
          { constraintId: 'past_simple_narrative', isCorrect: true, answeredAt: t1 },
          { constraintId: 'past_simple_narrative', isCorrect: true, answeredAt: t2 },
        ],
      },
      NOW,
    )
    expect(result.inProgress.map((m) => m.constraintId)).toContain('past_simple_narrative')
    expect(result.mastered.map((m) => m.constraintId)).not.toContain('past_simple_narrative')
  })

  it('classifies two correct attempts 2 days apart in mastered', () => {
    const result = buildCanSayNow(
      {
        attempts: [
          attempt('past_simple_narrative', true, 2),
          attempt('past_simple_narrative', true, 0),
        ],
      },
      NOW,
    )
    expect(result.mastered.map((m) => m.constraintId)).toContain('past_simple_narrative')
    expect(result.inProgress.map((m) => m.constraintId)).not.toContain('past_simple_narrative')
  })
})
