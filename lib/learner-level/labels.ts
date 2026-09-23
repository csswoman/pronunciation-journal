import type { LearnerLevelReadState } from './core'

export const learnerLevelSourceLabel: Record<LearnerLevelReadState, string> = {
  placement: 'Según tu evaluación',
  checkpoint: 'Según tu evaluación',
  manual: 'Elegido por ti',
  practice_estimate: 'Estimado por tu práctica',
  starter_default: 'Nivel inicial; haz la prueba para ajustarlo',
  unknown: 'No pudimos leer tu nivel ahora',
}
