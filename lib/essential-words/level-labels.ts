export type ExerciseLevel = 1 | 2 | 3

const LEVEL_LABELS: Record<ExerciseLevel, string> = {
  1: 'Reconocer',
  2: 'Recordar',
  3: 'Producir',
}

export function exerciseLevelLabel(level: ExerciseLevel): string {
  return LEVEL_LABELS[level]
}
