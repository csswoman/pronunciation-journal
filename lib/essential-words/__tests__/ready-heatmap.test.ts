import { describe, expect, it } from 'vitest'
import { buildHeatmap12w } from '../ready-heatmap'
import { buildStreakMarks } from '../ready-streak-marks'

describe('buildHeatmap12w', () => {
  it('returns 84 days ending today with intensity levels', () => {
    const now = new Date('2026-08-10T15:00:00')
    const days = buildHeatmap12w(
      ['2026-08-10T12:00:00.000Z', '2026-08-10T13:00:00.000Z', '2026-08-09T12:00:00.000Z'],
      now,
    )
    expect(days).toHaveLength(84)
    expect(days.at(-1)?.dayKey).toBe('2026-08-10')
    expect(days.at(-1)?.count).toBeGreaterThanOrEqual(1)
    expect(days.at(-1)?.level).toBeGreaterThan(0)
  })
})

describe('buildStreakMarks', () => {
  it('returns 7 booleans ending today', () => {
    const now = new Date('2026-08-10T15:00:00')
    const marks = buildStreakMarks(['2026-08-10T12:00:00.000Z', '2026-08-08T12:00:00.000Z'], now)
    expect(marks).toHaveLength(7)
    expect(marks[6]).toBe(true)
  })
})
