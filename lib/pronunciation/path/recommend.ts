import { getLearnerTargetCopy } from '@/lib/pronunciation/assessment/learner-copy'
import { getPathUnit, listPathUnitsInOrder } from './curriculum'
import type { PathRecommendation, UnitLearningState } from './types'

export interface RecommendNextPathActionInput {
  unitStates: ReadonlyMap<string, UnitLearningState>
  /** Priority target ids in diagnostic order (already capped ≤3 upstream). */
  diagnosticPriorityIds: readonly string[]
}

export function recommendNextPathAction(
  input: RecommendNextPathActionInput
): PathRecommendation {
  for (const id of input.diagnosticPriorityIds) {
    const state = input.unitStates.get(id) ?? 'not_started'
    if (state === 'retained') continue
    const unit = getPathUnit(id)
    if (!unit) continue
    const { title } = getLearnerTargetCopy(unit.targetId)
    return {
      targetId: unit.targetId,
      stageId: unit.stageId,
      reasonKind: 'diagnostic_priority',
      reasonEs: `Según tu diagnóstico, conviene practicar ${title} ahora.`,
    }
  }

  for (const unit of listPathUnitsInOrder()) {
    const state = input.unitStates.get(unit.targetId) ?? 'not_started'
    if (state === 'retained') continue
    const { title } = getLearnerTargetCopy(unit.targetId)
    return {
      targetId: unit.targetId,
      stageId: unit.stageId,
      reasonKind: 'canonical_next',
      reasonEs: `Siguiente paso: ${title}.`,
    }
  }

  return {
    targetId: null,
    stageId: null,
    reasonKind: 'all_retained',
    reasonEs: 'Ya completaste esta ruta. Puedes revisar una unidad o repetir el diagnóstico.',
  }
}
