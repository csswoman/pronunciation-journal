import { describe, it, expect } from 'vitest'
import {
  averageSpeechLatencyMs,
  tenseVarietyScore,
  latencyTrend,
  type SpeechAnswerRow,
} from '@/lib/progress/speech-metrics'

function row(overrides: Partial<SpeechAnswerRow> = {}): SpeechAnswerRow {
  return {
    slug: 'spoken_production',
    timeMs: 5000,
    constraintId: 'past_simple_narrative',
    isCorrect: true,
    answeredAt: '2026-08-24T10:00:00.000Z',
    ...overrides,
  }
}

describe('averageSpeechLatencyMs', () => {
  it('averages spoken attempts', () => {
    expect(averageSpeechLatencyMs([
      row({ timeMs: 4000 }),
      row({ timeMs: 6000 }),
    ])).toBe(5000)
  })

  it('ignores non-spoken exercises', () => {
    expect(averageSpeechLatencyMs([
      row({ timeMs: 4000 }),
      row({ slug: 'fill_blank', timeMs: 60000 }),
    ])).toBe(4000)
  })

  it('returns null with no spoken data', () => {
    expect(averageSpeechLatencyMs([])).toBeNull()
    expect(averageSpeechLatencyMs([row({ slug: 'fill_blank' })])).toBeNull()
  })

  it('discards implausible outliers', () => {
    // A five-minute "attempt" is a walked-away session, not thinking time.
    expect(averageSpeechLatencyMs([
      row({ timeMs: 4000 }),
      row({ timeMs: 300000 }),
    ])).toBe(4000)
  })
})

describe('tenseVarietyScore', () => {
  it('counts distinct constraints answered correctly', () => {
    const score = tenseVarietyScore([
      row({ constraintId: 'past_simple_narrative' }),
      row({ constraintId: 'present_perfect_experience' }),
      row({ constraintId: 'future_plan' }),
    ])
    expect(score.distinct).toBe(3)
  })

  it('does not credit failed attempts', () => {
    const score = tenseVarietyScore([
      row({ constraintId: 'past_simple_narrative', isCorrect: false }),
    ])
    expect(score.distinct).toBe(0)
  })

  it('does not double-count a repeated constraint', () => {
    const score = tenseVarietyScore([
      row({ constraintId: 'past_simple_narrative' }),
      row({ constraintId: 'past_simple_narrative' }),
    ])
    expect(score.distinct).toBe(1)
  })

  it('lists which constraints are still unused', () => {
    const score = tenseVarietyScore([row({ constraintId: 'past_simple_narrative' })])
    expect(score.missing).toContain('present_perfect_experience')
    expect(score.missing).not.toContain('past_simple_narrative')
  })

  it('handles rows with no constraint', () => {
    expect(tenseVarietyScore([row({ constraintId: null })]).distinct).toBe(0)
  })
})

describe('latencyTrend', () => {
  it('reports improvement when recent attempts are faster', () => {
    const older = [row({ timeMs: 9000, answeredAt: '2026-08-05T10:00:00.000Z' })]
    const recent = [row({ timeMs: 4000, answeredAt: '2026-08-20T10:00:00.000Z' })]
    const trend = latencyTrend([...older, ...recent], new Date('2026-08-24T10:00:00.000Z').getTime())
    expect(trend?.improvedMs).toBeGreaterThan(0)
  })

  it('returns null without both windows', () => {
    expect(latencyTrend([row()], new Date('2026-08-24').getTime())).toBeNull()
  })
})
