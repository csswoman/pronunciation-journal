import type { PathStage, UnitLearningState } from './types'

export type StageProgressState = 'not_started' | 'in_progress' | 'complete'

/**
 * Aggregate a stage's units into one progress state for the stepper.
 * A stage with no units (shouldn't happen, but data can be mid-migration)
 * reads as not_started rather than trivially complete.
 */
export function deriveStageProgress(
  stage: PathStage,
  unitStates: ReadonlyMap<string, UnitLearningState>
): StageProgressState {
  if (stage.units.length === 0) return 'not_started'

  const states = stage.units.map((unit) => unitStates.get(unit.targetId) ?? 'not_started')
  if (states.every((state) => state === 'retained')) return 'complete'
  if (states.some((state) => state !== 'not_started')) return 'in_progress'
  return 'not_started'
}
