import { describe, expect, it } from 'vitest'
import {
  computeNextMasteryPct,
  computeNextMasteryState,
  computeNextRawEma,
  computeRepScale,
  projectMasteryPct,
  sessionAccuracyPct,
} from '@/lib/phoneme-practice/mastery-pct'

describe('sessionAccuracyPct', () => {
  it('uses score when present for partial credit', () => {
    expect(
      sessionAccuracyPct([
        { isCorrect: true, score: 90 },
        { isCorrect: false, score: 40 },
      ]),
    ).toBe(65)
  })
})

describe('computeNextRawEma', () => {
  it('returns clean session accuracy on first session', () => {
    expect(computeNextRawEma(null, 80, null)).toBe(80)
  })

  it('decays toward new accuracy after long pause (>4 half-lives)', () => {
    const longAgo = new Date('2026-01-01T00:00:00Z').toISOString()
    const now = new Date('2026-03-01T00:00:00Z')
    const decayed = computeNextRawEma(100, 50, longAgo, now)
    expect(decayed).toBeGreaterThanOrEqual(50)
    expect(decayed).toBeLessThanOrEqual(53)
  })

  it('keeps prior EMA on immediate same-instant re-practice', () => {
    const instant = new Date('2026-06-01T12:00:00Z')
    expect(computeNextRawEma(80, 100, instant.toISOString(), instant)).toBe(80)
    expect(computeNextRawEma(0, 100, instant.toISOString(), instant)).toBe(0)
  })

  it('handles invalid date strings gracefully without NaN', () => {
    expect(computeNextRawEma(80, 90, 'invalid-date')).toBe(80)
  })

  it('safely clamps NaN, Infinity and bounds to [0, 100]', () => {
    expect(computeNextRawEma(NaN, 80, null)).toBe(80)
    expect(computeNextRawEma(80, NaN, null)).toBe(0)
    expect(computeNextRawEma(150, 120, null)).toBe(100)
    expect(computeNextRawEma(-10, -50, null)).toBe(0)
  })
})

describe('computeRepScale & projectMasteryPct', () => {
  it('scales monotonically from 0 to 1 at 10 sessions', () => {
    expect(computeRepScale(0)).toBe(0)
    expect(computeRepScale(1)).toBeCloseTo(0.316, 2)
    expect(computeRepScale(10)).toBe(1)
    expect(computeRepScale(25)).toBe(1)
    expect(computeRepScale(NaN)).toBe(0)
    expect(computeRepScale(-2)).toBe(0)
  })

  it('projects raw EMA with repScale clamped to [0, 100]', () => {
    expect(projectMasteryPct(80, 1)).toBe(25)
    expect(projectMasteryPct(80, 10)).toBe(80)
    expect(projectMasteryPct(150, 10)).toBe(100)
    expect(projectMasteryPct(-10, 10)).toBe(0)
    expect(projectMasteryPct(NaN, 5)).toBe(0)
  })
})

describe('computeNextMasteryState', () => {
  it('prevents mastery collapse across consecutive 80% sessions (plan 048)', () => {
    const t1 = new Date('2026-06-01T12:00:00Z')
    const t2 = new Date('2026-06-02T12:00:00Z')
    const s1 = computeNextMasteryState({ mastery_pct: 0, raw_mastery: null, last_seen: null }, 80, 1, t1)
    expect(s1.rawMastery).toBe(80)
    expect(s1.masteryPct).toBe(25)

    const s2 = computeNextMasteryState(
      { mastery_pct: s1.masteryPct, raw_mastery: s1.rawMastery, last_seen: t1.toISOString() },
      80,
      2,
      t2,
    )
    expect(s2.rawMastery).toBe(80)
    expect(s2.masteryPct).toBe(36)
    expect(s2.masteryPct).toBeGreaterThanOrEqual(s1.masteryPct)
  })

  it('supports legacy row without raw_mastery as conservative prior', () => {
    const t1 = new Date('2026-06-01T12:00:00Z')
    const t2 = new Date('2026-06-02T12:00:00Z')
    const legacy = computeNextMasteryState(
      { mastery_pct: 70, raw_mastery: null, last_seen: t1.toISOString() },
      80,
      5,
      t2,
    )
    expect(legacy.rawMastery).toBeGreaterThanOrEqual(70)
    expect(legacy.masteryPct).toBeGreaterThanOrEqual(49)
  })

  it('does not treat Essential Words presentation as a Sound Lab EMA prior', () => {
    const state = computeNextMasteryState(
      { mastery_pct: 100, raw_mastery: null, observation_count: 1, last_seen: null },
      40,
      1,
    )
    expect(state.rawMastery).toBe(40)
    expect(state.masteryPct).toBe(13)
  })
})

describe('computeNextMasteryPct', () => {
  it('first session scales accuracy by rep factor (~25% at 80% accuracy)', () => {
    const result = computeNextMasteryPct(0, 80, null, 1)
    expect(result).toBeGreaterThanOrEqual(24)
    expect(result).toBeLessThanOrEqual(26)
  })

  it('reaches ~80% after 10 sessions at 80% accuracy', () => {
    const result = computeNextMasteryPct(0, 80, null, 10)
    expect(result).toBeGreaterThanOrEqual(75)
    expect(result).toBeLessThanOrEqual(85)
  })

  it('decays toward a weaker session after ~7 days', () => {
    const lastSeen = new Date('2026-06-01T12:00:00Z')
    const now = new Date('2026-06-08T12:00:00Z')
    const next = computeNextMasteryPct(100, 80, lastSeen.toISOString(), 10, now)
    expect(next).toBeGreaterThanOrEqual(88)
    expect(next).toBeLessThanOrEqual(96)
  })

  it('barely moves on same-day re-practice', () => {
    const now = new Date('2026-06-08T12:00:00Z')
    const next = computeNextMasteryPct(100, 60, now.toISOString(), 10, now)
    expect(next).toBeGreaterThanOrEqual(95)
  })

  it('preserves growth across sessions when rawMastery is supplied', () => {
    const t1 = new Date('2026-06-01T12:00:00Z')
    const t2 = new Date('2026-06-02T12:00:00Z')
    const s1 = computeNextMasteryPct(0, 80, null, 1, t1)
    const s2 = computeNextMasteryPct(s1, 80, t1.toISOString(), 2, t2, 80)
    expect(s2).toBe(36)
    expect(s2).toBeGreaterThanOrEqual(s1)
  })
})
