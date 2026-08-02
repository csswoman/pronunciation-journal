import type { DailyStep } from '@/lib/practice/types'

function hasEvaluatedContent(step: DailyStep): boolean {
  return (
    step.exercises.length > 0 ||
    (step.studyCards?.length ?? 0) > 0 ||
    !!step.readerPassage
  )
}

/**
 * Link-only steps never auto-complete — they must not block the post-plan
 * surface on Home /daily. Includes concept, study_deck, and any href-only row.
 */
export function isOptionalLinkStep(step: DailyStep): boolean {
  if (step.kind === 'concept' || step.kind === 'study_deck') return true
  return Boolean(step.href) && !hasEvaluatedContent(step)
}

/** Steps that must be done before the daily practice is considered complete. */
export function requiredPracticeSteps(steps: readonly DailyStep[]): DailyStep[] {
  return steps.filter((step) => !isOptionalLinkStep(step))
}
