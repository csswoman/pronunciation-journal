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
})
