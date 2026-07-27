// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/lib/db'
import { persistMissionSession } from '../persistence'
import { createMissionState, missionReducer } from '../state-machine'
import { deriveMissionOutcome } from '../outcome'
import { getMission } from '../registry'

const mission = getMission('roleplay.cafe')!

describe('persistMissionSession', () => {
  beforeEach(async () => {
    await db.open()
    await db.missionSessions.clear()
  })

  it('writes exactly one MissionSessionRecord per session', async () => {
    let state = createMissionState(mission.id)
    state = missionReducer(state, { type: 'intent_observed', intentId: 'placed_order' }, mission)
    const outcome = deriveMissionOutcome(state, mission)

    await persistMissionSession('user-1', mission, state, outcome)

    const rows = await db.missionSessions.where('userId').equals('user-1').toArray()
    expect(rows).toHaveLength(1)
    expect(rows[0].missionId).toBe('roleplay.cafe')
    expect(rows[0].targetIds).toEqual(mission.targets.map((target) => target.targetId))
  })

  it('a two-account run never lets account B see account A session', async () => {
    const state = createMissionState(mission.id)
    const outcome = deriveMissionOutcome(state, mission)

    await persistMissionSession('user-a', mission, state, outcome)

    const bRows = await db.missionSessions.where('userId').equals('user-b').toArray()
    expect(bRows).toHaveLength(0)
  })
})
