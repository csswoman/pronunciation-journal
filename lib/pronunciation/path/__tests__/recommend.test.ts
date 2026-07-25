import { describe, expect, it } from 'vitest'
import { contrastTargetId, phonemeTargetId } from '@/lib/pronunciation/targets/registry'
import { listPathUnitsInOrder } from '../curriculum'
import { recommendNextPathAction } from '../recommend'
import type { UnitLearningState } from '../types'

const TH = contrastTargetId('/θ/', '/ð/')
const SCHWA = phonemeTargetId('/ə/')

function allStates(fill: UnitLearningState): Map<string, UnitLearningState> {
  return new Map(listPathUnitsInOrder().map((u) => [u.targetId, fill]))
}

describe('recommendNextPathAction', () => {
  it('prefers a non-retained diagnostic priority', () => {
    const states = allStates('not_started')
    const rec = recommendNextPathAction({
      unitStates: states,
      diagnosticPriorityIds: [SCHWA, TH],
    })
    expect(rec.targetId).toBe(SCHWA)
    expect(rec.reasonKind).toBe('diagnostic_priority')
  })

  it('skips retained priorities and falls through', () => {
    const states = allStates('not_started')
    states.set(SCHWA, 'retained')
    const rec = recommendNextPathAction({
      unitStates: states,
      diagnosticPriorityIds: [SCHWA, TH],
    })
    expect(rec.targetId).toBe(TH)
  })

  it('uses canonical stage-1 order when no diagnostic priorities', () => {
    const states = allStates('not_started')
    const rec = recommendNextPathAction({
      unitStates: states,
      diagnosticPriorityIds: [],
    })
    expect(rec.targetId).toBe(TH)
    expect(rec.reasonKind).toBe('canonical_next')
  })

  it('returns all_retained when every unit is retained', () => {
    const rec = recommendNextPathAction({
      unitStates: allStates('retained'),
      diagnosticPriorityIds: [TH],
    })
    expect(rec.targetId).toBeNull()
    expect(rec.reasonKind).toBe('all_retained')
  })
})
