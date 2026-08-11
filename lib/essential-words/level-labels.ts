export type ExerciseLevel = 1 | 2 | 3

const LEVEL_LABELS: Record<ExerciseLevel, string> = {
  1: 'Paso 1 · Reconoce',
  2: 'Paso 2 · Recuerda',
  3: 'Paso 3 · Produce',
}

export function exerciseLevelLabel(level: ExerciseLevel): string {
  return LEVEL_LABELS[level]
}
