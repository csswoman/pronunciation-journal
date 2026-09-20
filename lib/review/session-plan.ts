import type { DailyStep } from '@/lib/practice/types'
import type { ReviewPlan } from '@/lib/practice/daily-plan/composer'

/** Combines independently loaded review sources without mutating either input. */
export function composeReviewSessionPlan(
  plan: ReviewPlan,
  topicSteps: readonly DailyStep[],
): ReviewPlan {
  const seen = new Set<string>()
  const exerciseSteps = plan.steps.filter((step) => !step.href || step.exercises.length > 0)
  const linkSteps = plan.steps.filter((step) => step.href && step.exercises.length === 0)
  const steps = [...exerciseSteps, ...topicSteps, ...linkSteps].filter((step) => {
    if (seen.has(step.id)) return false
    seen.add(step.id)
    return true
  })
  return {
    steps,
    totalExercises: steps.reduce((total, step) => total + step.exercises.length, 0),
    nothingDue: steps.length === 0,
  }
}
