import { describe, expect, it } from 'vitest'
import { listTargets, resolvePrerequisiteChain } from '@/lib/pronunciation/targets/registry'
import {
  PATH_STAGE_ORDER,
  buildPronunciationPathCurriculum,
  listPathUnitsInOrder,
  pickUnitForStage,
} from '../curriculum'

describe('buildPronunciationPathCurriculum', () => {
  it('exposes exactly five stages in stable order', () => {
    const curriculum = buildPronunciationPathCurriculum()
    expect(curriculum.stages.map((s) => s.id)).toEqual([...PATH_STAGE_ORDER])
    expect(curriculum.stages).toHaveLength(5)
  })

  it('includes every registry target exactly once', () => {
    const units = listPathUnitsInOrder()
    const ids = units.map((u) => u.targetId)
    expect(new Set(ids).size).toBe(ids.length)
    for (const target of listTargets()) {
      expect(ids).toContain(target.id)
    }
  })

  it('every unit resolves in the registry and has acyclic prerequisites', () => {
    for (const unit of listPathUnitsInOrder()) {
      expect(() => resolvePrerequisiteChain(unit.targetId)).not.toThrow()
      const chain = resolvePrerequisiteChain(unit.targetId)
      expect(chain.includes(unit.targetId)).toBe(false)
    }
  })

  it('attaches content-map refs when authored', () => {
    const schwa = listPathUnitsInOrder().find((u) => u.targetId.includes('./ə/'))
    expect(schwa?.contentRefs.length).toBeGreaterThan(0)
  })

  it('picks the first open unit for a stage', () => {
    const unit = pickUnitForStage('intonation-transfer', new Map())
    expect(unit?.stageId).toBe('intonation-transfer')
    expect(unit?.targetId).toContain('intonation')
  })
})
