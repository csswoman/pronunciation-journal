import { describe, expect, it } from 'vitest'
import { startOfRollingWindow, sumWeeklyExercises } from '@/lib/progress/windows'

describe('weekly activity summary', () => {
  it('sums session exercise totals instead of counting answer rows', () => {
    expect(sumWeeklyExercises([
      { exercises_total: 5 },
      { exercises_total: 3 },
      { exercises_total: null },
    ])).toBe(8)
  })

  it('uses one shared rolling-window boundary', () => {
    expect(startOfRollingWindow(7, new Date('2026-06-21T12:00:00Z')).toISOString())
      .toBe('2026-06-14T12:00:00.000Z')
  })
})
