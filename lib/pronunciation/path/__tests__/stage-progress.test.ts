import { describe, expect, it } from 'vitest'
import { deriveStageProgress } from '../stage-progress'
import type { PathStage, UnitLearningState } from '../types'

function stage(unitIds: string[]): PathStage {
  return {
    id: 'sounds',
    titleEs: 'Sonidos',
    titleShortEs: 'Sonidos',
    units: unitIds.map((targetId) => ({
      targetId: targetId as PathStage['units'][number]['targetId'],
      stageId: 'sounds',
      contentRefs: [],
      practiceHref: null,
    })),
  }
}

function statesMap(entries: Record<string, UnitLearningState>): Map<string, UnitLearningState> {
  return new Map(Object.entries(entries))
}

describe('deriveStageProgress', () => {
  it('is not_started when no unit has any progress', () => {
    const result = deriveStageProgress(stage(['a', 'b']), statesMap({ a: 'not_started', b: 'not_started' }))
    expect(result).toBe('not_started')
  })

  it('is complete only when every unit is retained', () => {
    const result = deriveStageProgress(stage(['a', 'b']), statesMap({ a: 'retained', b: 'retained' }))
    expect(result).toBe('complete')
  })

  it('is in_progress when some units have started but not all are retained', () => {
    const result = deriveStageProgress(stage(['a', 'b']), statesMap({ a: 'retained', b: 'learning' }))
    expect(result).toBe('in_progress')
  })

  it('treats missing map entries as not_started', () => {
    const result = deriveStageProgress(stage(['a', 'b']), statesMap({ a: 'learning' }))
    expect(result).toBe('in_progress')
  })

  it('is not_started for a stage with no units', () => {
    const result = deriveStageProgress(stage([]), statesMap({}))
    expect(result).toBe('not_started')
  })
})
