import { describe, it, expect } from 'vitest'
import { recentMissionAvoidance, type MissionSessionSummary } from '../mission-avoidance'

function session(overrides: Partial<MissionSessionSummary> = {}): MissionSessionSummary {
  return {
    status: 'completed',
    startedAt: '2026-09-18T10:00:00.000Z',
    ...overrides,
  }
}

describe('recentMissionAvoidance', () => {
  it('reports no avoidance when there is no history', () => {
    expect(recentMissionAvoidance([])).toBe(false)
  })

  it('reports no avoidance when the learner completed their last mission', () => {
    expect(recentMissionAvoidance([session({ status: 'completed' })])).toBe(false)
  })

  it('reports no avoidance with only one cancelled session (needs 2 in a row)', () => {
    expect(recentMissionAvoidance([session({ status: 'cancelled' })])).toBe(false)
  })

  it('reports avoidance when the last 2 sessions were both cancelled', () => {
    const sessions = [
      session({ status: 'cancelled', startedAt: '2026-09-19T10:00:00.000Z' }),
      session({ status: 'cancelled', startedAt: '2026-09-17T10:00:00.000Z' }),
      session({ status: 'completed', startedAt: '2026-09-10T10:00:00.000Z' }),
    ]
    expect(recentMissionAvoidance(sessions)).toBe(true)
  })

  it('does not report avoidance when a completed session breaks up two cancellations', () => {
    const sessions = [
      session({ status: 'cancelled', startedAt: '2026-09-19T10:00:00.000Z' }),
      session({ status: 'completed', startedAt: '2026-09-17T10:00:00.000Z' }),
      session({ status: 'cancelled', startedAt: '2026-09-10T10:00:00.000Z' }),
    ]
    expect(recentMissionAvoidance(sessions)).toBe(false)
  })

  it('treats in_progress and provider_error as non-avoidance signals (not the learner giving up)', () => {
    const sessions = [
      session({ status: 'in_progress', startedAt: '2026-09-19T10:00:00.000Z' }),
      session({ status: 'provider_error', startedAt: '2026-09-17T10:00:00.000Z' }),
    ]
    expect(recentMissionAvoidance(sessions)).toBe(false)
  })

  it('sorts by startedAt itself — caller order is not assumed', () => {
    const sessions = [
      session({ status: 'completed', startedAt: '2026-09-10T10:00:00.000Z' }),
      session({ status: 'cancelled', startedAt: '2026-09-19T10:00:00.000Z' }),
      session({ status: 'cancelled', startedAt: '2026-09-17T10:00:00.000Z' }),
    ]
    expect(recentMissionAvoidance(sessions)).toBe(true)
  })
})
