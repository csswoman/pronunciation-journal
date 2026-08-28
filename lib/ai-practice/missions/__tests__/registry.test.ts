import { describe, expect, it } from 'vitest'
import { getTarget } from '@/lib/pronunciation/targets/registry'
import {
  LEGACY_ROLEPLAY_SCENARIOS,
  getMission,
  legacyModeForMission,
  listMissions,
  listScriptedMissions,
  listConversationalMissions,
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

  it('includes full-stack, frontend, backend and behavioral tech interview missions', () => {
    const techMissionIds = [
      'roleplay.interview.about_me',
      'roleplay.interview.fullstack',
      'roleplay.interview.frontend',
      'roleplay.interview.backend',
      'roleplay.interview.project',
      'roleplay.interview.star_challenge',
      'roleplay.interview.reverse_questions',
    ]

    for (const id of techMissionIds) {
      const mission = getMission(id)
      expect(mission).not.toBeNull()
      expect(mission?.category).toBe('interview')
    }
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

describe('selectores por modo', () => {
  it('listScriptedMissions solo devuelve misiones con guion, y al menos una', () => {
    const scripted = listScriptedMissions()
    expect(scripted.length).toBeGreaterThan(0)
    expect(scripted.every((mission) => mission.mode === 'scripted')).toBe(true)
  })

  it('listConversationalMissions solo devuelve conversacionales, y al menos una', () => {
    const conversational = listConversationalMissions()
    expect(conversational.length).toBeGreaterThan(0)
    expect(conversational.every((mission) => mission.mode === 'conversational')).toBe(true)
  })

  it('las dos listas juntas cubren el catalogo entero sin solaparse', () => {
    // Si alguien anade un tercer modo, esta asercion falla y obliga a
    // decidir en que pestana vive — que es exactamente lo que queremos.
    const total = listScriptedMissions().length + listConversationalMissions().length
    expect(total).toBe(listMissions().length)
  })
})
