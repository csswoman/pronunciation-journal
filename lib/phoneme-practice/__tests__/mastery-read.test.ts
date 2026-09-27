import { describe, expect, it } from 'vitest'
import {
  buildSoundMasteryMap,
  liveMasteryPct,
  rankWeakestSounds,
  soundMasteryPct,
} from '@/lib/phoneme-practice/mastery-read'
import { contrastKey } from '@/lib/phoneme-practice/phoneme-similarity'
import type { UserContrastProgress } from '@/lib/phoneme-practice/types'

const makeRow = (
  contrastId: string,
  mastery: number,
  attempts = 10,
  lastSeen: string | null = null,
  rawMastery: number | null = null,
  rawMasteryUpdatedAt: string | null = null,
  masterySessionCount = 0,
  observationCount?: number,
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
  raw_mastery: rawMastery,
  raw_mastery_updated_at: rawMasteryUpdatedAt,
  mastery_session_count: masterySessionCount,
  observation_count: observationCount,
})

describe('soundMasteryPct', () => {
  it('uses minimum contrast mastery for a sound', () => {
    const progress = [makeRow('/iː/|/ɪ/', 100), makeRow('/iː/|/ɛ/', 70)]
    expect(soundMasteryPct('/iː/', progress)).toBe(70)
  })

  it('uses raw_mastery with projection when present', () => {
    const progress = [makeRow('/iː/|/ɪ/', 25, 2, '2026-06-01T12:00:00Z', 80, null, 1)]
    expect(soundMasteryPct('/iː/', progress, new Date('2026-06-01T12:00:00Z'))).toBe(25)
  })

  it('uses the persisted mastery session count instead of guessing from attempts', () => {
    const progress = [makeRow('/iː/|/ɪ/', 36, 10, '2026-06-01T12:00:00Z', 80, null, 2)]
    expect(soundMasteryPct('/iː/', progress, new Date('2026-06-01T12:00:00Z'))).toBe(36)
  })

  it('does not decay raw mastery from a non-Sound-Lab last_seen timestamp', () => {
    const progress = [makeRow('/iː/|/ɪ/', 80, 10, '2026-01-01T12:00:00Z', 80, '2026-06-02T12:00:00Z', 10)]
    expect(soundMasteryPct('/iː/', progress, new Date('2026-06-02T12:00:00Z'))).toBe(80)
  })

  it('decays a stale contrast score toward zero the longer it goes unpracticed', () => {
    const lastSeen = new Date('2026-01-01T00:00:00Z')
    const now = new Date('2026-02-15T00:00:00Z')
    const progress = [makeRow('/θ/|/ð/', 90, 10, lastSeen.toISOString())]
    const stale = soundMasteryPct('/θ/', progress, now)
    const fresh = soundMasteryPct('/θ/', progress, lastSeen)
    expect(stale).toBeLessThan(fresh)
    expect(stale).toBeLessThan(50)
  })

  it('does not decay when last_seen is unknown (back-compat)', () => {
    const progress = [makeRow('/θ/|/ð/', 90, 10, null)]
    expect(soundMasteryPct('/θ/', progress, new Date('2027-01-01'))).toBe(90)
  })
})

describe('liveMasteryPct', () => {
  it('returns stored value unchanged when there is no last_seen', () => {
    expect(liveMasteryPct(80, null)).toBe(80)
  })

  it('returns 0 unchanged (nothing to decay)', () => {
    expect(liveMasteryPct(0, '2026-01-01T00:00:00Z', new Date('2026-06-01'))).toBe(0)
  })

  it('decays by exp(-1) ≈ 37% of original value after one half-life (14 days)', () => {
    const lastSeen = new Date('2026-01-01T00:00:00Z')
    const now = new Date('2026-01-15T00:00:00Z')
    expect(liveMasteryPct(80, lastSeen.toISOString(), now)).toBeCloseTo(29, -0.5)
  })
})

describe('rankWeakestSounds', () => {
  it('surfaces a long-unpracticed sound as weak even if stored mastery was high', () => {
    const longAgo = new Date('2026-01-01T00:00:00Z').toISOString()
    const recent = new Date('2026-01-14T00:00:00Z').toISOString()
    const now = new Date('2026-01-15T00:00:00Z')
    const progress = [
      makeRow(contrastKey('/m/', '/n/'), 90, 10, longAgo),
      makeRow(contrastKey('/g/', '/k/'), 60, 10, recent),
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
    const map = buildSoundMasteryMap([makeRow('/æ/|/ɛ/', 72, 5, null)])
    expect(map.get('/æ/')).toBe(72)
  })
})
