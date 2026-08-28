import { describe, it, expect } from 'vitest'
import {
  calculateWeeklySpeakingProgress,
  getStartOfCurrentWeek,
  type OralPracticeSession,
} from '@/lib/practice/speaking-challenge'

describe('speaking-challenge', () => {
  it('calculates start of week as Monday 00:00:00', () => {
    // Wednesday 2026-08-26
    const wed = new Date(2026, 7, 26, 15, 30, 0)
    const start = getStartOfCurrentWeek(wed)
    expect(start.getDay()).toBe(1) // Monday
    expect(start.getHours()).toBe(0)
    expect(start.getMinutes()).toBe(0)
    expect(start.getDate()).toBe(24) // Monday Aug 24
  })

  it('aggregates sessions within the current week and computes progress', () => {
    const refDate = new Date(2026, 7, 26, 12, 0, 0) // Wednesday
    const monday = new Date(2026, 7, 24, 10, 0, 0)
    const tuesday = new Date(2026, 7, 25, 11, 0, 0)
    const lastWeek = new Date(2026, 7, 20, 10, 0, 0)

    const sessions: OralPracticeSession[] = [
      { timestamp: monday, durationSeconds: 60 },
      { timestamp: tuesday, durationSeconds: 90 },
      { timestamp: lastWeek, durationSeconds: 300 }, // should be ignored
    ]

    const result = calculateWeeklySpeakingProgress(sessions, 5, refDate)
    expect(result.completedSeconds).toBe(150)
    expect(result.targetSeconds).toBe(300)
    expect(result.progressRatio).toBe(0.5)
    expect(result.isCompleted).toBe(false)
    expect(result.formattedTime).toBe('2:30')
  })

  it('marks challenge as completed when goal is reached', () => {
    const refDate = new Date(2026, 7, 26, 12, 0, 0)
    const monday = new Date(2026, 7, 24, 10, 0, 0)

    const sessions: OralPracticeSession[] = [
      { timestamp: monday, durationSeconds: 320 },
    ]

    const result = calculateWeeklySpeakingProgress(sessions, 5, refDate)
    expect(result.completedSeconds).toBe(320)
    expect(result.progressRatio).toBe(1)
    expect(result.isCompleted).toBe(true)
    expect(result.remainingSeconds).toBe(0)
  })
})
