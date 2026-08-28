import { describe, expect, it } from 'vitest'
import { suggestScriptedMission } from '../suggest'
import { emptyLearnerContext } from '@/lib/ai-coach/learner-context'
import type { ScriptedMission } from '../../types'

function mission(id: string, cefr: ScriptedMission['recommendedCefr']): ScriptedMission {
  return {
    id, mode: 'scripted', origin: 'authored', category: 'service',
    recommendedCefr: cefr, context: id, communicativeGoal: 'x',
    targets: [], script: [{ id: `${id}-1`, speaker: 'coach', text: 'Hi' }],
  }
}

const catalog = [mission('a1-one', 'A1'), mission('b1-one', 'B1'), mission('c1-one', 'C1')]

describe('suggestScriptedMission', () => {
  it('elige el guión más cercano al nivel del estudiante', () => {
    const result = suggestScriptedMission(catalog, { ...emptyLearnerContext(), cefr: 'B1' })
    expect(result?.mission.id).toBe('b1-one')
  })

  it('explica por qué lo sugiere', () => {
    const result = suggestScriptedMission(catalog, { ...emptyLearnerContext(), cefr: 'B1' })
    expect(result?.reason).toContain('B1')
  })

  it('cae al más cercano cuando no hay coincidencia exacta', () => {
    const result = suggestScriptedMission(catalog, { ...emptyLearnerContext(), cefr: 'B2' })
    expect(result?.mission.id).toBe('b1-one')
  })

  it('devuelve null con catálogo vacío', () => {
    expect(suggestScriptedMission([], emptyLearnerContext())).toBeNull()
  })
})
