import type { CEFRLevel } from '@/lib/exercises/cefr'
import type { LearnerContext } from '@/lib/ai-coach/learner-context'

/**
 * Mínimo de debilidades para que el repaso tenga sentido. Por debajo, el
 * guión se parecería demasiado a uno normal y no merece una llamada aparte.
 */
export const MIN_WEAKNESSES_FOR_REVIEW = 3

export interface ReviewScriptRequest {
  topic: string
  cefr: CEFRLevel
  srsDueWords: string[]
}

/**
 * Petición de un "examen de recuperación" hablado, hecho solo con lo peor
 * pronunciado últimamente. Sin historial suficiente devuelve `null` y el
 * llamador cae a la generación normal.
 */
export function buildReviewScriptRequest(
  context: LearnerContext,
): ReviewScriptRequest | null {
  const weaknesses = [...context.strugglingWords, ...context.weakTargets.map(String)]
  if (weaknesses.length < MIN_WEAKNESSES_FOR_REVIEW) return null

  return {
    topic: 'una conversación de repaso con las palabras que más te cuestan',
    cefr: context.cefr,
    srsDueWords: context.strugglingWords.slice(0, 6),
  }
}
