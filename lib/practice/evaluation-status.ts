import type { PracticeAnswer } from './types'

type EvaluationFields = Pick<PracticeAnswer, 'status' | 'userAnswer'>

/**
 * A result contributes to accuracy only when it represents an evaluated answer.
 * Rows without status are legacy: every non-skip answer remains evaluable.
 */
export function isEvaluatedPracticeAnswer(answer: EvaluationFields): boolean {
  return answer.status === 'answered'
    || (answer.status === undefined && answer.userAnswer !== 'skip')
}

interface PersistedEvaluationFields {
  grade: number | null
  user_answer: string | null
  exercise_payload: unknown
}

function persistedStatus(payload: unknown): PracticeAnswer['status'] | undefined {
  if (!payload || typeof payload !== 'object') return undefined
  const status = (payload as { status?: unknown }).status
  return status === 'answered'
    || status === 'skipped'
    || status === 'unscored'
    || status === 'evaluator_failed'
    ? status
    : undefined
}

/** A numeric grade includes zero; null means the interaction was not graded. */
export function isEvaluatedHistoryRow(row: PersistedEvaluationFields): boolean {
  if (typeof row.grade !== 'number') return false
  const status = persistedStatus(row.exercise_payload)
  return status === 'answered'
    || (status === undefined && row.user_answer !== 'skip')
}
