import { describe, it, expect } from 'vitest'
import {
  shouldOfferMission,
  MISSION_DAYS_OF_WEEK,
} from '@/lib/practice/daily-plan/mission-cadence'

describe('shouldOfferMission', () => {
  it('runs three times a week', () => {
    expect(MISSION_DAYS_OF_WEEK).toHaveLength(3)
  })

  it('offers a mission on its scheduled days', () => {
    for (const day of MISSION_DAYS_OF_WEEK) {
      expect(shouldOfferMission(day, true)).toBe(true)
    }
  })

  it('skips days that are not scheduled', () => {
    const offDays = [0, 1, 2, 3, 4, 5, 6].filter(
      (d) => !MISSION_DAYS_OF_WEEK.includes(d),
    )
    for (const day of offDays) {
      expect(shouldOfferMission(day, true)).toBe(false)
    }
  })

  it('never offers a mission without speech recognition', () => {
    for (const day of MISSION_DAYS_OF_WEEK) {
      expect(shouldOfferMission(day, false)).toBe(false)
    }
  })

  it('spreads the days out instead of clustering them', () => {
    const sorted = [...MISSION_DAYS_OF_WEEK].sort((a, b) => a - b)
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i]! - sorted[i - 1]!).toBeGreaterThanOrEqual(2)
    }
  })
})
