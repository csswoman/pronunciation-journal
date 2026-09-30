/**
 * Retry budget for AI-graded production. The local pipeline
 * (`grading-pipeline.ts`) resolves what it can offline; this module decides
 * whether the attempt that survived it deserves to spend a request.
 */

import { normalizeAcceptedAnswer } from './grading-pipeline'

/** Two graded versions per exercise and session; after that, self-assessment. */
export const MAX_AI_GRADES_PER_EXERCISE = 2
/** Below this many normalized edits the retry is the same answer again. */
export const MIN_ATTEMPT_EDIT_DISTANCE = 3

export const REPEATED_ATTEMPT_MESSAGE =
  'Es la misma respuesta. Cámbiala con la pista y vuelve a enviarla.'
export const AI_GRADES_SPENT_MESSAGE =
  'Ya corregimos dos versiones de esta oración. Compárala con el ejemplo y decide tú si es correcta.'

export type GradingBlockedReason = 'offline' | 'repeated' | 'budget-spent'

/** Thrown from the pipeline's `beforeAiCall` gate; never reaches the cache. */
export class AiGradingBlockedError extends Error {
  constructor(
    readonly reason: GradingBlockedReason,
    message: string,
  ) {
    super(message)
    this.name = 'AiGradingBlockedError'
  }
}

export interface AttemptHistory {
  /** Raw text of the previous attempt, or null on the first one. */
  lastProduction: string | null
  /** AI calls already spent on this exercise during this session. */
  aiGrades: number
}

/** Levenshtein distance between the normalized forms of both answers. */
export function normalizedEditDistance(left: string, right: string): number {
  const a = normalizeAcceptedAnswer(left)
  const b = normalizeAcceptedAnswer(right)
  if (a === b) return 0
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index)
  for (let row = 1; row <= a.length; row += 1) {
    const current = [row]
    for (let column = 1; column <= b.length; column += 1) {
      current[column] = Math.min(
        previous[column] + 1,
        current[column - 1] + 1,
        previous[column - 1] + (a[row - 1] === b[column - 1] ? 0 : 1),
      )
    }
    previous = current
  }
  return previous[b.length]
}

/** A retry that barely differs from the previous one is not worth a request. */
export function isSameAttempt(production: string, previous: string): boolean {
  return normalizedEditDistance(production, previous) < MIN_ATTEMPT_EDIT_DISTANCE
}

/**
 * Gate for the AI branch of the pipeline. Throws `AiGradingBlockedError` when
 * the attempt must be answered locally instead of with a request.
 */
export function assertAiGradeAllowed(
  production: string,
  history: AttemptHistory,
  online = true,
): void {
  if (!online) {
    throw new AiGradingBlockedError(
      'offline',
      'Necesitas conexión a internet para corregir tu respuesta.',
    )
  }
  if (history.aiGrades >= MAX_AI_GRADES_PER_EXERCISE) {
    throw new AiGradingBlockedError('budget-spent', AI_GRADES_SPENT_MESSAGE)
  }
  if (history.lastProduction !== null && isSameAttempt(production, history.lastProduction)) {
    throw new AiGradingBlockedError('repeated', REPEATED_ATTEMPT_MESSAGE)
  }
}
