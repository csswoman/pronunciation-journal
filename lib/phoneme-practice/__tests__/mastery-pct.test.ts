import { describe, expect, it } from 'vitest'
import {
  buildSoundMasteryMap,
  computeNextMasteryPct,
  sessionAccuracyPct,
  soundMasteryPct,
} from '@/lib/phoneme-practice/mastery-pct'
import type { UserContrastProgress } from '@/lib/phoneme-practice/types'

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

describe('computeNextMasteryPct', () => {
  it('first session scales accuracy by rep factor (~25% at 80% accuracy)', () => {
    // session 1 of 10: sqrt(1/10) ≈ 0.316 → 80 * 0.316 ≈ 25
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
    // 10 sessions accumulated, repScale = 1; decayFactor ≈ 0.65 → ema ≈ 93
    const next = computeNextMasteryPct(100, 80, lastSeen.toISOString(), 10, now)
    expect(next).toBeGreaterThanOrEqual(88)
    expect(next).toBeLessThanOrEqual(96)
  })

  it('barely moves on same-day re-practice', () => {
    const now = new Date('2026-06-08T12:00:00Z')
    // 10 sessions, repScale = 1
    const next = computeNextMasteryPct(100, 60, now.toISOString(), 10, now)
    expect(next).toBeGreaterThanOrEqual(95)
  })
})

describe('soundMasteryPct', () => {
  const row = (
    contrastId: string,
    mastery: number,
    attempts = 10,
  ): UserContrastProgress => ({
    id: '1',
    user_id: 'u',
    contrast_id: contrastId,
    ease_factor: 2.5,
    interval_days: 1,
    next_review: null,
    last_seen: null,
    total_attempts: attempts,
    correct_answers: attempts,
    streak: 1,
    mastery_pct: mastery,
  })

  it('uses minimum contrast mastery for a sound', () => {
    const progress = [
      row('/iː/|/ɪ/', 100),
      row('/iː/|/ɛ/', 70),
    ]
    expect(soundMasteryPct('/iː/', progress)).toBe(70)
  })
})

describe('buildSoundMasteryMap', () => {
  it('exposes mastery keyed by IPA', () => {
    const map = buildSoundMasteryMap([
      {
        id: '1',
        user_id: 'u',
        contrast_id: '/æ/|/ɛ/',
        ease_factor: 2.5,
        interval_days: 1,
        next_review: null,
        last_seen: null,
        total_attempts: 5,
        correct_answers: 4,
        streak: 1,
        mastery_pct: 72,
      },
    ])
    expect(map.get('/æ/')).toBe(72)
  })
})
