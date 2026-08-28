import { describe, expect, it } from 'vitest'
import { SCRIPTED_MISSIONS } from '../catalog'
import { isScriptedMission } from '../../types'

describe('scripted catalog', () => {
  it('trae al menos un guión', () => {
    expect(SCRIPTED_MISSIONS.length).toBeGreaterThan(0)
  })

  it('todas son de modo scripted y origen autorado', () => {
    for (const mission of SCRIPTED_MISSIONS) {
      expect(isScriptedMission(mission)).toBe(true)
      expect(mission.origin).toBe('authored')
    }
  })

  it('no repite ids de misión', () => {
    const ids = SCRIPTED_MISSIONS.map((m) => m.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('no repite ids de línea dentro de un guión', () => {
    for (const mission of SCRIPTED_MISSIONS) {
      const ids = mission.script.map((line) => line.id)
      expect(new Set(ids).size).toBe(ids.length)
    }
  })

  it('cada guión alterna e incluye turnos del estudiante', () => {
    for (const mission of SCRIPTED_MISSIONS) {
      expect(mission.script.some((line) => line.speaker === 'learner')).toBe(true)
      expect(mission.script.some((line) => line.speaker === 'coach')).toBe(true)
    }
  })

  it('empieza siempre con el coach', () => {
    for (const mission of SCRIPTED_MISSIONS) {
      expect(mission.script[0].speaker).toBe('coach')
    }
  })
})
