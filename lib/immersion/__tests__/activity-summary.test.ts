import { describe, expect, it } from 'vitest'
import { summarizeImmersionActivity } from '../activity-summary'

describe('summarizeImmersionActivity', () => {
  it('derives this week and the streak from persisted immersion sessions', () => {
    const summary = summarizeImmersionActivity([
      { completedAt: '2026-09-19T14:00:00.000Z', durationMs: 30 * 60_000 },
      { completedAt: '2026-09-18T14:00:00.000Z', durationMs: 15 * 60_000 },
      { completedAt: '2026-09-10T14:00:00.000Z', durationMs: 45 * 60_000 },
    ], '2026-09-19T18:00:00.000Z')

    expect(summary).toEqual({ currentStreak: 2, weekMinutes: 45 })
  })

  it('buckets days at America/Lima midnight and counts one session as an active day', () => {
    // 04:30Z is 23:30 on the 18th in Lima; 05:30Z is 00:30 on the 19th.
    // Same UTC date, two Lima days: a UTC bucket would report a streak of 1.
    const summary = summarizeImmersionActivity([
      { completedAt: '2026-09-19T04:30:00.000Z', durationMs: 60_000 },
      { completedAt: '2026-09-19T05:30:00.000Z', durationMs: 60_000 },
    ], '2026-09-19T18:00:00.000Z')

    expect(summary.currentStreak).toBe(2)
  })
})
