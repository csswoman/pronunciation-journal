import { normalize } from '../answer-match'
import { TENSE_CHECKS } from './tenses'
import { CONDITIONAL_CHECKS } from './conditionals'
import { QUESTIONS_SYNTAX_CHECKS } from './questions-syntax'
import type { StructureCheck, StructureCheckId } from './types'

export type { StructureCheck, StructureCheckId } from './types'
export { isParticipleVerb, isPastSimpleVerb, pastForms, participleForms } from './irregular-verbs'

export const STRUCTURE_CHECKS: Record<StructureCheckId, StructureCheck> = {
  ...TENSE_CHECKS,
  ...CONDITIONAL_CHECKS,
  ...QUESTIONS_SYNTAX_CHECKS,
} as Record<StructureCheckId, StructureCheck>

export function checkStructures(
  text: string,
  ids: StructureCheckId[],
): { ok: boolean; missing: StructureCheckId[] } {
  if (!ids || ids.length === 0) return { ok: true, missing: [] }
  const tokens = normalize(text).split(/\s+/).filter(Boolean)
  const missing: StructureCheckId[] = []

  for (const id of ids) {
    const checker = STRUCTURE_CHECKS[id]
    if (!checker || !checker.test(tokens)) {
      missing.push(id)
    }
  }

  return { ok: missing.length === 0, missing }
}
