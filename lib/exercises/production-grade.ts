/** Shared shape for AI production grading (client + server). */

export interface ProductionGradeResult {
  /** Overall pass: target used correctly and grammar acceptable. */
  correct: boolean
  /** Student used the target item with correct meaning/form. */
  usedTarget: boolean
  /** Sentence is grammatically acceptable for the learner level. */
  grammaticallyCorrect: boolean
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
}
