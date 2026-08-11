import { describe, expect, it } from 'vitest'
import { bucketDueForecast } from '../ready-forecast'

describe('bucketDueForecast', () => {
  it('returns 7 days with zeros when nothing is due', () => {
    const now = new Date('2026-08-10T15:00:00')
    const days = bucketDueForecast([], now)
    expect(days).toHaveLength(7)
    expect(days.every((d) => d.count === 0)).toBe(true)
    expect(days[0]?.dayKey).toBe('2026-08-10')
  })

  it('buckets dues into local calendar days within the window', () => {
    const now = new Date('2026-08-10T15:00:00')
    const days = bucketDueForecast(
      [
        '2026-08-10T18:00:00.000Z',
        '2026-08-12T09:00:00.000Z',
        '2026-08-12T22:00:00.000Z',
        '2026-08-20T12:00:00.000Z',
      ],
      now,
    )
    expect(days.find((d) => d.dayKey === '2026-08-12')?.count).toBeGreaterThanOrEqual(1)
    expect(days.reduce((sum, d) => sum + d.count, 0)).toBeLessThanOrEqual(3)
  })
})
