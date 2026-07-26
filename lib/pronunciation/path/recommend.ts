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
      reasonEs: `Tu diagnóstico señaló ${title} como foco. Sigamos ahí.`,
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
      reasonEs: `Empezamos por ${title}, el siguiente paso de la ruta.`,
    }
  }

  return {
    targetId: null,
    stageId: null,
    reasonKind: 'all_retained',
    reasonEs: 'Ya cubriste esta ruta. Puedes explorar de nuevo o repetir el diagnóstico.',
  }
}
