import { describe, it, expect } from 'vitest'
import {
  shouldOfferMission,
  MISSION_DAYS_OF_WEEK,
  shouldOfferScriptedMission,
  getRotatingSlotKind,
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

describe('shouldOfferScriptedMission', () => {
  it('ofrece guión en martes y jueves', () => {
    expect(shouldOfferScriptedMission(2, true)).toBe(true)
    expect(shouldOfferScriptedMission(4, true)).toBe(true)
  })

  it('no compite con los días de conversación libre', () => {
    expect(shouldOfferScriptedMission(1, true)).toBe(false)
    expect(shouldOfferScriptedMission(3, true)).toBe(false)
    expect(shouldOfferScriptedMission(5, true)).toBe(false)
  })

  it('no ofrece nada sin reconocimiento de voz', () => {
    expect(shouldOfferScriptedMission(2, false)).toBe(false)
  })
})

describe('getRotatingSlotKind', () => {
  it('rotates across all days of the week consistently', () => {
    expect(getRotatingSlotKind(1)).toBe('mission') // Monday
    expect(getRotatingSlotKind(2)).toBe('reader')  // Tuesday
    expect(getRotatingSlotKind(3)).toBe('mission') // Wednesday
    expect(getRotatingSlotKind(4)).toBe('reader')  // Thursday
    expect(getRotatingSlotKind(5)).toBe('mission') // Friday
    expect(getRotatingSlotKind(6)).toBe('sentence_builder') // Saturday
    expect(getRotatingSlotKind(0)).toBe('review')  // Sunday
  })
})


