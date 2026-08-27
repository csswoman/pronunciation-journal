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
import { SCRIPTED_MISSIONS } from '../scripted/catalog'

describe('oral mission registry', () => {
  it('contains eight unique, target-backed missions', () => {
    const missions = listMissions()

    expect(missions.length).toBeGreaterThanOrEqual(8)
    expect(new Set(missions.map((mission) => mission.id)).size).toBe(missions.length)
    expect(validateMissionRegistry()).toEqual([])

    for (const mission of missions) {
      expect(mission.context).toBeTruthy()
      expect(mission.communicativeGoal).toBeTruthy()
      if (isConversationalMission(mission)) {
        // Los targets guian el bucle de correccion del roleplay, asi que ahi son obligatorios.
        expect(mission.targets.length).toBeGreaterThanOrEqual(2)
        expect(mission.targets.length).toBeLessThanOrEqual(3)
        expect(mission.opening).toBeTruthy()
        expect(mission.requiredIntents.length).toBeGreaterThan(0)
      }
      if (isScriptedMission(mission)) {
        // El guion puntua por alineacion de fonemas, no por targets autorados:
        // los targets son pistas opcionales por linea.
        expect(mission.script.length).toBeGreaterThan(0)
        expect(mission.script.some((line) => line.speaker === 'learner')).toBe(true)
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
  it('expone ambos modos en el registry', () => {
    const missions = listMissions()
    expect(missions.some(isConversationalMission)).toBe(true)
    expect(missions.some(isScriptedMission)).toBe(true)
  })

  it('los type guards son mutuamente excluyentes', () => {
    for (const mission of listMissions()) {
      expect(isScriptedMission(mission)).toBe(!isConversationalMission(mission))
    }
  })

  it('registra el catalogo con guion y lo hace alcanzable por id', () => {
    for (const scripted of SCRIPTED_MISSIONS) {
      const found = getMission(scripted.id)
      expect(found).not.toBeNull()
      expect(found && isScriptedMission(found)).toBe(true)
    }
  })
})
