import type { PracticeAnswer } from './types'

type EvaluationFields = Pick<PracticeAnswer, 'status' | 'userAnswer'>

/**
 * A result contributes to accuracy only when it represents an evaluated answer.
 * Rows without status are legacy: every non-skip answer remains evaluable.
 */
export function isEvaluatedPracticeAnswer(answer: EvaluationFields): boolean {
  if (answer.userAnswer === 'skip') return false
  return answer.status === 'answered'
    || (answer.status === undefined && answer.userAnswer !== 'skip')
}

interface PersistedEvaluationFields {
  grade: number | null
  user_answer: string | null
  exercise_payload: unknown
}

function persistedStatus(payload: unknown): {
  present: boolean
  value?: PracticeAnswer['status']
} {
  if (!payload || typeof payload !== 'object') return { present: false }
  if (!Object.prototype.hasOwnProperty.call(payload, 'status')) return { present: false }

  const status = (payload as { status?: unknown }).status
  const value = status === 'answered'
    || status === 'skipped'
    || status === 'unscored'
    || status === 'evaluator_failed'
    ? status
    : undefined
  return { present: true, value }
}

/** A numeric grade includes zero; null means the interaction was not graded. */
export function isEvaluatedHistoryRow(row: PersistedEvaluationFields): boolean {
  if (typeof row.grade !== 'number') return false
  if (row.user_answer === 'skip') return false
  const status = persistedStatus(row.exercise_payload)
  return status.present ? status.value === 'answered' : true
}
