import { describe, expect, it } from 'vitest'
import {
  buildSoundMasteryMap,
  computeNextMasteryPct,
  liveMasteryPct,
  rankWeakestSounds,
  sessionAccuracyPct,
  soundMasteryPct,
} from '@/lib/phoneme-practice/mastery-pct'
import { contrastKey } from '@/lib/phoneme-practice/phoneme-similarity'
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
    lastSeen: string | null = null,
  ): UserContrastProgress => ({
    id: '1',
    user_id: 'u',
    contrast_id: contrastId,
    ease_factor: 2.5,
    interval_days: 1,
    next_review: null,
    last_seen: lastSeen,
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

  it('decays a stale contrast score toward zero the longer it goes unpracticed', () => {
    const lastSeen = new Date('2026-01-01T00:00:00Z')
    const now = new Date('2026-02-15T00:00:00Z') // ~45 days later, ~3 half-lives
    const progress = [row('/θ/|/ð/', 90, 10, lastSeen.toISOString())]
    const stale = soundMasteryPct('/θ/', progress, now)
    const fresh = soundMasteryPct('/θ/', progress, lastSeen)
    expect(stale).toBeLessThan(fresh)
    expect(stale).toBeLessThan(50)
  })

  it('does not decay when last_seen is unknown (back-compat)', () => {
    const progress = [row('/θ/|/ð/', 90, 10, null)]
    expect(soundMasteryPct('/θ/', progress, new Date('2027-01-01'))).toBe(90)
  })
})

describe('liveMasteryPct', () => {
  it('returns the stored value unchanged when there is no last_seen', () => {
    expect(liveMasteryPct(80, null)).toBe(80)
  })

  it('returns 0 unchanged (nothing to decay)', () => {
    expect(liveMasteryPct(0, '2026-01-01T00:00:00Z', new Date('2026-06-01'))).toBe(0)
  })

  it('decays by exp(-1) ≈ 37% of the original value after one half-life (14 days)', () => {
    const lastSeen = new Date('2026-01-01T00:00:00Z')
    const now = new Date('2026-01-15T00:00:00Z') // 14 days later
    // decayFactor = exp(-14/14) = exp(-1) ≈ 0.368 → 80 * 0.368 ≈ 29
    expect(liveMasteryPct(80, lastSeen.toISOString(), now)).toBeCloseTo(29, -0.5)
  })
})

describe('rankWeakestSounds', () => {
  const row = (
    contrastId: string,
    mastery: number,
    attempts = 10,
    lastSeen: string | null = null,
  ): UserContrastProgress => ({
    id: '1',
    user_id: 'u',
    contrast_id: contrastId,
    ease_factor: 2.5,
    interval_days: 1,
    next_review: null,
    last_seen: lastSeen,
    total_attempts: attempts,
    correct_answers: attempts,
    streak: 1,
    mastery_pct: mastery,
  })

  it('surfaces a long-unpracticed sound as weak even if its stored mastery was high', () => {
    const longAgo = new Date('2026-01-01T00:00:00Z').toISOString()
    const recent = new Date('2026-01-14T00:00:00Z').toISOString() // 13 days later, ~1 half-life apart
    const now = new Date('2026-01-15T00:00:00Z')
    // Use IPAs outside PHONEME_CONFUSION so soundMasteryPct falls back to the
    // plain "related contrasts" path instead of the confusable-pair path —
    // that keeps the two rows fully independent for this assertion.
    const progress = [
      row(contrastKey('/m/', '/n/'), 90, 10, longAgo), // high stored mastery, but stale by ~14 days
      row(contrastKey('/g/', '/k/'), 60, 10, recent),  // lower stored mastery, but practiced yesterday
    ]
    const ranked = rankWeakestSounds(progress, { limit: 4, now })
    const m = ranked.find((r) => r.ipa === 'm')
    const g = ranked.find((r) => r.ipa === 'g')
    expect(m).toBeDefined()
    expect(g).toBeDefined()
    expect(m!.mastery).toBeLessThan(g!.mastery)
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
