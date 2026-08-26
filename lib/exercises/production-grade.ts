/** Shared shape for AI production grading (client + server). */

import type { CEFRLevel } from './cefr'
import type { ErrorPatternId } from './error-patterns'

export interface ProductionGradeResult {
  /** Overall pass: target used correctly and grammar acceptable. */
  correct: boolean
  /** Student used the target item with correct meaning/form. */
  usedTarget: boolean
  /** Sentence is grammatically acceptable for the learner level. */
  grammaticallyCorrect: boolean
  /**
   * The response satisfied the required communicative constraint (tense or
   * function). True when no constraint was requested.
   */
  constraintMet: boolean
  /**
   * Structured label for the main error, when the response was not correct.
   * Drives scheduled recurrence — see lib/practice/error-recurrence.ts.
   */
  errorPattern?: ErrorPatternId
  /** Actionable feedback (1–3 sentences). */
  feedback: string
  /** Corrected version when applicable. */
  corrections?: string
  /** 0–100 quality score for SRS mapping. */
  score: number
}

export interface GradeProductionInput {
  targetItem: string
  targetMeaning?: string
  taskPrompt: string
  production: string
  modality: 'written' | 'spoken'
  /** Learner CEFR level so grammar is judged against the right bar. */
  level?: CEFRLevel
  /** English instruction describing the constraint the grader must verify. */
  constraintCheck?: string
}
