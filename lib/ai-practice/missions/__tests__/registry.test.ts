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

describe('oral mission registry', () => {
  it('contains eight unique, target-backed missions', () => {
    const missions = listMissions()

    expect(missions).toHaveLength(8)
    expect(new Set(missions.map((mission) => mission.id)).size).toBe(missions.length)
    expect(validateMissionRegistry()).toEqual([])

    for (const mission of missions) {
      expect(mission.context).toBeTruthy()
      expect(mission.communicativeGoal).toBeTruthy()
      expect(mission.opening).toBeTruthy()
      expect(mission.targets.length).toBeGreaterThanOrEqual(2)
      expect(mission.targets.length).toBeLessThanOrEqual(3)
      expect(mission.requiredIntents.length).toBeGreaterThan(0)
      for (const target of mission.targets) {
        expect(getTarget(target.targetId).ok).toBe(true)
        expect(target.phrase).toBeTruthy()
      }
    }
  })

  it.each(LEGACY_ROLEPLAY_SCENARIOS)('round-trips legacy mode roleplay:%s', (scenario) => {
    const missionId = missionIdFromLegacyMode(`roleplay:${scenario}`)

    expect(missionId).toBe(`roleplay.${scenario}`)
    expect(getMission(missionId)?.id).toBe(missionId)
    expect(legacyModeForMission(missionId)).toBe(`roleplay:${scenario}`)
  })

  it('rejects unknown mission ids without a fallback', () => {
    expect(getMission('roleplay.unknown')).toBeNull()
    expect(missionIdFromLegacyMode('roleplay:unknown')).toBeNull()
  })
})
