import { describe, it, expect } from 'vitest'
import {
  computeStreakFromTimestamps,
  toLocalDateString,
  DAILY_STREAK_THRESHOLD,
} from '../streak-core'

// All tests use Lima timezone (UTC-5, no DST) unless noted otherwise.
const TZ = 'America/Lima'
const N = DAILY_STREAK_THRESHOLD // 5

// Helper: build N timestamps for a given local date in Lima, spread across the day.
function answersOn(localDate: string, count: number = N): string[] {
  // localDate is YYYY-MM-DD in Lima (UTC-5). Noon local = 17:00 UTC.
  return Array.from({ length: count }, (_, i) => {
    const hour = 12 + i  // 12:00–16:xx local, well within the same day
    return `${localDate}T${String(hour).padStart(2, '0')}:00:00-05:00`
  })
}

// ── toLocalDateString ────────────────────────────────────────────────────────

describe('toLocalDateString', () => {
  it('converts UTC midnight correctly to Lima date', () => {
    // 2026-05-23T00:00:00Z is 2026-05-22 19:00 Lima time
    expect(toLocalDateString('2026-05-23T00:00:00Z', TZ)).toBe('2026-05-22')
  })

  it('converts UTC 23:59 correctly to Lima date', () => {
    // 2026-05-23T23:59:00Z is 2026-05-23 18:59 Lima time
    expect(toLocalDateString('2026-05-23T23:59:00Z', TZ)).toBe('2026-05-23')
  })

  it('handles the Lima midnight boundary (05:00 UTC = 00:00 Lima)', () => {
    // 2026-05-24T05:00:00Z = 2026-05-24 00:00 Lima
    expect(toLocalDateString('2026-05-24T05:00:00Z', TZ)).toBe('2026-05-24')
    // 2026-05-24T04:59:59Z = 2026-05-23 23:59 Lima
    expect(toLocalDateString('2026-05-24T04:59:59Z', TZ)).toBe('2026-05-23')
  })
})

// ── Basic streak counting ─────────────────────────────────────────────────────

describe('computeStreakFromTimestamps — basic', () => {
  it('returns zeros for empty input', () => {
    const now = '2026-05-23T15:00:00-05:00'
    const result = computeStreakFromTimestamps([], now, TZ)
    expect(result).toEqual({ currentStreak: 0, maxStreak: 0, completedToday: false })
  })

  it('returns 0 when answers exist but below threshold', () => {
    const now = '2026-05-23T15:00:00-05:00'
    const ts = answersOn('2026-05-23', N - 1)
    const result = computeStreakFromTimestamps(ts, now, TZ)
    expect(result.currentStreak).toBe(0)
    expect(result.completedToday).toBe(false)
  })

  it('counts exactly N answers as 1 qualifying day', () => {
    const now = '2026-05-23T15:00:00-05:00'
    const ts = answersOn('2026-05-23', N)
    const result = computeStreakFromTimestamps(ts, now, TZ)
    expect(result.currentStreak).toBe(1)
    expect(result.completedToday).toBe(true)
    expect(result.maxStreak).toBe(1)
  })

  it('counts 3 consecutive qualifying days correctly', () => {
    const now = '2026-05-23T15:00:00-05:00'
    const ts = [
      ...answersOn('2026-05-21'),
      ...answersOn('2026-05-22'),
      ...answersOn('2026-05-23'),
    ]
    const result = computeStreakFromTimestamps(ts, now, TZ)
    expect(result.currentStreak).toBe(3)
    expect(result.maxStreak).toBe(3)
    expect(result.completedToday).toBe(true)
  })
})

// ── Timezone / midnight boundary ─────────────────────────────────────────────

describe('computeStreakFromTimestamps — timezone boundaries', () => {
  it('answers just before Lima midnight belong to the correct local day', () => {
    // 2026-05-23T04:59:00Z = 2026-05-22 23:59 Lima → qualifies for 2026-05-22
    const ts = Array.from({ length: N }, (_, i) =>
      `2026-05-23T04:${String(i).padStart(2, '0')}:00Z`
    )
    // now = late in the same Lima day (2026-05-22 evening, just before midnight)
    const now = '2026-05-23T04:58:00Z' // 2026-05-22 23:58 Lima
    const result = computeStreakFromTimestamps(ts, now, TZ)
    expect(result.completedToday).toBe(true)
    expect(result.currentStreak).toBe(1)
  })

  it('answers just after Lima midnight belong to the next local day', () => {
    // 2026-05-23T05:01:00Z = 2026-05-23 00:01 Lima → qualifies for 2026-05-23
    const ts = Array.from({ length: N }, (_, i) =>
      `2026-05-23T05:${String(i + 1).padStart(2, '0')}:00Z`
    )
    // now = morning of 2026-05-23 Lima
    const now = '2026-05-23T14:00:00Z' // 2026-05-23 09:00 Lima
    const result = computeStreakFromTimestamps(ts, now, TZ)
    expect(result.completedToday).toBe(true)
    expect(result.currentStreak).toBe(1)
  })

  it('does not count the same UTC date split across two Lima days as two days', () => {
    // Answers spanning Lima midnight: some before 05:00 UTC (Lima prev day),
    // some after — total per Lima day < threshold.
    const beforeMidnight = Array.from({ length: 3 }, (_, i) =>
      `2026-05-23T04:0${i}:00Z` // Lima: 2026-05-22 23:0x
    )
    const afterMidnight = Array.from({ length: 3 }, (_, i) =>
      `2026-05-23T05:0${i + 1}:00Z` // Lima: 2026-05-23 00:0x
    )
    const now = '2026-05-23T14:00:00Z'
    const result = computeStreakFromTimestamps([...beforeMidnight, ...afterMidnight], now, TZ)
    // Neither Lima day has ≥ 5 answers
    expect(result.currentStreak).toBe(0)
    expect(result.completedToday).toBe(false)
  })
})

// ── Skipped days ─────────────────────────────────────────────────────────────

describe('computeStreakFromTimestamps — skipped days', () => {
  it('resets currentStreak when a day is skipped', () => {
    const now = '2026-05-23T15:00:00-05:00'
    const ts = [
      ...answersOn('2026-05-20'),
      ...answersOn('2026-05-21'),
      // skip 2026-05-22
      ...answersOn('2026-05-23'),
    ]
    const result = computeStreakFromTimestamps(ts, now, TZ)
    expect(result.currentStreak).toBe(1)
    expect(result.maxStreak).toBe(2)
  })

  it('maxStreak captures the longest historical run even after a break', () => {
    const now = '2026-05-23T15:00:00-05:00'
    const ts = [
      ...answersOn('2026-05-10'),
      ...answersOn('2026-05-11'),
      ...answersOn('2026-05-12'),
      ...answersOn('2026-05-13'),
      // gap
      ...answersOn('2026-05-20'),
      ...answersOn('2026-05-21'),
    ]
    // now = 2026-05-23, yesterday (2026-05-22) not done → grace window used
    const result = computeStreakFromTimestamps(ts, now, TZ)
    expect(result.maxStreak).toBe(4)
    expect(result.currentStreak).toBe(0) // gap breaks yesterday too
  })

  it('handles non-consecutive qualifying days within a week', () => {
    const now = '2026-05-23T15:00:00-05:00'
    const ts = [
      ...answersOn('2026-05-19'),
      ...answersOn('2026-05-21'),
      ...answersOn('2026-05-23'),
    ]
    const result = computeStreakFromTimestamps(ts, now, TZ)
    expect(result.currentStreak).toBe(1)
    expect(result.maxStreak).toBe(1)
  })
})

// ── Grace window: today vs yesterday ─────────────────────────────────────────

describe('computeStreakFromTimestamps — grace window', () => {
  it('currentStreak survives when today is not yet done but yesterday was', () => {
    // now = early morning of 2026-05-23 Lima, no answers yet today
    const now = '2026-05-23T08:00:00-05:00'
    const ts = [
      ...answersOn('2026-05-21'),
      ...answersOn('2026-05-22'),
      // 2026-05-23 not done yet
    ]
    const result = computeStreakFromTimestamps(ts, now, TZ)
    expect(result.completedToday).toBe(false)
    expect(result.currentStreak).toBe(2) // grace: anchors on yesterday
  })

  it('grace window does not apply when yesterday was also skipped', () => {
    const now = '2026-05-23T08:00:00-05:00'
    const ts = [
      ...answersOn('2026-05-20'),
      ...answersOn('2026-05-21'),
      // 2026-05-22 skipped, 2026-05-23 not done
    ]
    const result = computeStreakFromTimestamps(ts, now, TZ)
    expect(result.currentStreak).toBe(0)
  })

  it('when both today and yesterday are done, anchors on today', () => {
    const now = '2026-05-23T15:00:00-05:00'
    const ts = [
      ...answersOn('2026-05-21'),
      ...answersOn('2026-05-22'),
      ...answersOn('2026-05-23'),
    ]
    const result = computeStreakFromTimestamps(ts, now, TZ)
    expect(result.completedToday).toBe(true)
    expect(result.currentStreak).toBe(3)
  })
})

// ── maxStreak vs currentStreak independence ───────────────────────────────────

describe('computeStreakFromTimestamps — max vs current', () => {
  it('maxStreak never decreases after a break', () => {
    const now = '2026-05-23T15:00:00-05:00'
    const ts = [
      ...answersOn('2026-05-01'),
      ...answersOn('2026-05-02'),
      ...answersOn('2026-05-03'),
      ...answersOn('2026-05-04'),
      ...answersOn('2026-05-05'),
      // long gap
      ...answersOn('2026-05-22'),
      ...answersOn('2026-05-23'),
    ]
    const result = computeStreakFromTimestamps(ts, now, TZ)
    expect(result.maxStreak).toBe(5)
    expect(result.currentStreak).toBe(2)
  })

  it('maxStreak equals currentStreak when only one unbroken run exists', () => {
    const now = '2026-05-23T15:00:00-05:00'
    const ts = [
      ...answersOn('2026-05-21'),
      ...answersOn('2026-05-22'),
      ...answersOn('2026-05-23'),
    ]
    const result = computeStreakFromTimestamps(ts, now, TZ)
    expect(result.maxStreak).toBe(result.currentStreak)
  })

  it('single qualifying day gives both streaks = 1', () => {
    const now = '2026-05-23T15:00:00-05:00'
    const ts = answersOn('2026-05-23')
    const result = computeStreakFromTimestamps(ts, now, TZ)
    expect(result.currentStreak).toBe(1)
    expect(result.maxStreak).toBe(1)
  })
})
