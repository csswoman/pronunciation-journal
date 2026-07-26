import type { UnitLearningState } from './types'

/** Learner-facing Spanish labels for path unit learning states. */
export const UNIT_STATE_LABEL_ES: Record<UnitLearningState, string> = {
  not_started: 'Sin empezar',
  learning: 'En progreso',
  ready_for_transfer: 'Lista para frases',
  retained: 'Afianzada',
}

/** Matches `Badge` semantic variants without importing UI into lib. */
export type UnitStateBadgeVariant =
  | 'neutral'
  | 'info'
  | 'warning'
  | 'success'
  | 'default'
  | 'error'

export function unitStateLabelEs(state: UnitLearningState | undefined): string {
  return UNIT_STATE_LABEL_ES[state ?? 'not_started']
}

/** Semantic badge variant — color carries state meaning, not decoration. */
export function unitStateBadgeVariant(
  state: UnitLearningState | undefined
): UnitStateBadgeVariant {
  switch (state ?? 'not_started') {
    case 'learning':
      return 'info'
    case 'ready_for_transfer':
      return 'warning'
    case 'retained':
      return 'success'
    case 'not_started':
      return 'neutral'
  }
}
