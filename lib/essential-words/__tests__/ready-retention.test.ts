import { describe, expect, it } from 'vitest'
import { computeRetention30d } from '../ready-retention'

describe('computeRetention30d', () => {
  const now = new Date('2026-08-10T12:00:00.000Z')

  it('hides when sample is below the minimum', () => {
    const attempts = Array.from({ length: 5 }, (_, i) => ({
      occurredAt: `2026-08-0${i + 1}T12:00:00.000Z`,
      correct: true,
      eventType: 'scheduled-review',
    }))
    expect(computeRetention30d(attempts, now)).toBeNull()
  })

  it('prefers scheduled-review when enough exist', () => {
    const scheduled = Array.from({ length: 10 }, (_, i) => ({
      occurredAt: `2026-08-${String(i + 1).padStart(2, '0')}T12:00:00.000Z`,
      correct: i < 8,
      eventType: 'scheduled-review',
    }))
    const noise = Array.from({ length: 20 }, (_, i) => ({
      occurredAt: `2026-07-${String(i + 1).padStart(2, '0')}T12:00:00.000Z`,
      correct: false,
      eventType: 'practice',
    }))
    expect(computeRetention30d([...scheduled, ...noise], now)).toEqual({
      pct: 80,
      sampleSize: 10,
    })
  })

  it('falls back to all attempts when scheduled sample is thin', () => {
    const mixed = Array.from({ length: 12 }, (_, i) => ({
      occurredAt: `2026-07-${String(i + 15).padStart(2, '0')}T12:00:00.000Z`,
      correct: i < 9,
      eventType: i < 3 ? 'scheduled-review' : 'practice',
    }))
    expect(computeRetention30d(mixed, now)).toEqual({
      pct: 75,
      sampleSize: 12,
    })
  })
})
