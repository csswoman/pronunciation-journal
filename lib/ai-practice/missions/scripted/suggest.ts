import { cefrDistance } from '@/lib/exercises/cefr'
import type { LearnerContext } from '@/lib/ai-coach/learner-context'
import type { ScriptedMission } from '../types'

export interface ScriptSuggestion {
  mission: ScriptedMission
  /** Razón legible: la sugerencia debe explicarse, no ser mágica. */
  reason: string
}

/**
 * Elige el guión más cercano al nivel del estudiante.
 *
 * La razón se muestra en la UI a propósito: una recomendación que no se
 * explica se percibe como arbitraria y se ignora.
 */
export function suggestScriptedMission(
  catalog: readonly ScriptedMission[],
  context: LearnerContext,
): ScriptSuggestion | null {
  if (catalog.length === 0) return null

  const best = [...catalog].sort(
    (a, b) =>
      Math.abs(cefrDistance(context.cefr, a.recommendedCefr)) -
      Math.abs(cefrDistance(context.cefr, b.recommendedCefr)),
  )[0]

  const reasonParts = [`${best.recommendedCefr} · tu nivel es ${context.cefr}`]
  if (context.weakTargets.length > 0) {
    reasonParts.push(`trabaja ${context.weakTargets[0]}`)
  }

  return { mission: best, reason: reasonParts.join(' · ') }
}
