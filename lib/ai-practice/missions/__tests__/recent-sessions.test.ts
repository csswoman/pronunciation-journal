// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import { describe, it, expect, afterEach } from 'vitest'
import { db } from '@/lib/db'
import { loadRecentMissionSessions } from '../recent-sessions'
import type { MissionSessionRecord } from '@/lib/db'

function record(overrides: Partial<MissionSessionRecord> = {}): MissionSessionRecord {
  return {
    id: globalThis.crypto.randomUUID(),
    userId: 'user-1',
    missionId: 'mission-a',
    targetIds: [],
    outcome: {},
    turnCount: 3,
    status: 'completed',
    startedAt: '2026-09-18T10:00:00.000Z',
    completedAt: '2026-09-18T10:05:00.000Z',
    ...overrides,
  }
}

describe('loadRecentMissionSessions', () => {
  afterEach(async () => {
    await db.missionSessions.clear()
  })

  it('returns only the given user\'s sessions, most recent first, capped at the limit', async () => {
    await db.missionSessions.bulkPut([
      record({ id: 'a', userId: 'user-1', startedAt: '2026-09-10T00:00:00.000Z' }),
      record({ id: 'b', userId: 'user-1', startedAt: '2026-09-19T00:00:00.000Z' }),
      record({ id: 'c', userId: 'user-1', startedAt: '2026-09-15T00:00:00.000Z' }),
      record({ id: 'd', userId: 'user-2', startedAt: '2026-09-20T00:00:00.000Z' }),
    ])

    const result = await loadRecentMissionSessions('user-1', 2)

    expect(result.map((s) => s.startedAt)).toEqual([
      '2026-09-19T00:00:00.000Z',
      '2026-09-15T00:00:00.000Z',
    ])
  })

  it('returns an empty array for a user with no sessions', async () => {
    expect(await loadRecentMissionSessions('nobody', 2)).toEqual([])
  })
})
