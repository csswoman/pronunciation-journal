// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { db, type MissionSessionRecord } from '../index'

function record(overrides: Partial<MissionSessionRecord> = {}): MissionSessionRecord {
  const now = new Date().toISOString()
  return {
    id: 'session-1',
    userId: 'user-a',
    missionId: 'roleplay.cafe',
    targetIds: ['segmental.contrast.iː|ɪ'],
    outcome: {
      missionId: 'roleplay.cafe',
      goalAchieved: true,
      intelligibilityEvidence: { attempts: [], scoredCount: 0 },
      targetEvidence: [],
      repairUsed: false,
      unscoredReasons: [],
    },
    turnCount: 4,
    status: 'completed',
    startedAt: now,
    completedAt: now,
    ...overrides,
  }
}

describe('mission session Dexie table', () => {
  beforeEach(async () => { await db.open() })
  afterEach(async () => { await db.missionSessions.clear() })

  it('stores and retrieves a mission session scoped to a user', async () => {
    await db.missionSessions.put(record())

    const rows = await db.missionSessions.where('userId').equals('user-a').toArray()
    expect(rows).toHaveLength(1)
    expect(rows[0].missionId).toBe('roleplay.cafe')
  })

  it('isolates sessions by userId', async () => {
    await db.missionSessions.put(record())

    const userBRows = await db.missionSessions.where('userId').equals('user-b').toArray()
    expect(userBRows).toHaveLength(0)
  })
})
