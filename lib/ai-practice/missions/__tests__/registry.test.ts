import { describe, expect, it } from 'vitest'
import { getTarget } from '@/lib/pronunciation/targets/registry'
import {
  LEGACY_ROLEPLAY_SCENARIOS,
  getMission,
  legacyModeForMission,
  listMissions,
  missionIdFromLegacyMode,
  validateMissionRegistry,
} from '../registry'
import { isScriptedMission, isConversationalMission } from '../types'

describe('oral mission registry', () => {
  it('contains eight unique, target-backed missions', () => {
    const missions = listMissions()

    expect(missions.length).toBeGreaterThanOrEqual(8)
    expect(new Set(missions.map((mission) => mission.id)).size).toBe(missions.length)
    expect(validateMissionRegistry()).toEqual([])

    for (const mission of missions) {
      expect(mission.context).toBeTruthy()
      expect(mission.communicativeGoal).toBeTruthy()
      expect(mission.targets.length).toBeGreaterThanOrEqual(2)
      expect(mission.targets.length).toBeLessThanOrEqual(3)
      if (isConversationalMission(mission)) {
        expect(mission.opening).toBeTruthy()
        expect(mission.requiredIntents.length).toBeGreaterThan(0)
      }
      for (const target of mission.targets) {
        expect(getTarget(target.targetId).ok).toBe(true)
        expect(target.phrase).toBeTruthy()
      }
    }

  })

  it.each(LEGACY_ROLEPLAY_SCENARIOS)('round-trips legacy mode roleplay:%s', (scenario) => {
    const missionId = missionIdFromLegacyMode(`roleplay:${scenario}`)

    expect(missionId).not.toBeNull()
    if (!missionId) throw new Error('legacy scenario did not resolve')
    expect(missionId).toBe(`roleplay.${scenario}`)
    expect(getMission(missionId)?.id).toBe(missionId)
    expect(legacyModeForMission(missionId)).toBe(`roleplay:${scenario}`)
  })

  it('rejects unknown mission ids without a fallback', () => {
    expect(getMission('roleplay.unknown')).toBeNull()
    expect(missionIdFromLegacyMode('roleplay:unknown')).toBeNull()
  })
})

describe('mission mode discriminant', () => {
  it('marca todas las misiones autoradas como conversacionales', () => {
    const missions = listMissions()
    expect(missions.length).toBeGreaterThan(0)
    expect(missions.every(isConversationalMission)).toBe(true)
  })

  it('los type guards son mutuamente excluyentes', () => {
    for (const mission of listMissions()) {
      expect(isScriptedMission(mission)).toBe(false)
    }
  })
})
