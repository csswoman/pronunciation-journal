import { getTarget } from '@/lib/pronunciation/targets/registry'
import type { TargetResult } from '@/lib/pronunciation/assessment/types'
import type { SpokenAttemptOutcome } from '@/lib/pronunciation/spoken-attempt'
import type { PathUnit, UnitLearningState } from './types'

/** Path-local spoken evidence — SpokenAttempt has no attemptedAt field. */
export interface PathSpokenEvidence {
  targetId: string
  outcome: SpokenAttemptOutcome
  attemptedAt: string
}

export interface DeriveUnitLearningStateInput {
  unit: PathUnit
  completedContentKeys: ReadonlySet<string>
  spokenAttempts: readonly PathSpokenEvidence[]
  /** Scored diagnostic perception/STT — one objective sample for readiness, never retention alone. */
  diagnosticScored?: boolean
}

function contentDone(unit: PathUnit, completed: ReadonlySet<string>): boolean {
  if (unit.contentRefs.length === 0) return false
  return unit.contentRefs.some((ref) => completed.has(`${ref.kind}:${ref.slug}`))
}

function scorablesFor(
  unit: PathUnit,
  attempts: readonly PathSpokenEvidence[]
): PathSpokenEvidence[] {
  return attempts.filter((a) => a.targetId === unit.targetId && a.outcome === 'scored')
}

function distinctUtcDays(isoDates: readonly string[]): number {
  return new Set(isoDates.map((iso) => iso.slice(0, 10))).size
}

export function deriveUnitLearningState(input: DeriveUnitLearningStateInput): UnitLearningState {
  const { unit, completedContentKeys, spokenAttempts, diagnosticScored = false } = input
  const lookup = getTarget(unit.targetId)
  const masteryEligible = lookup.ok ? lookup.target.masteryEligible : false
  const done = contentDone(unit, completedContentKeys)
  const scorables = scorablesFor(unit, spokenAttempts)
  const hasObjective = scorables.length > 0 || diagnosticScored

  if (!done && !hasObjective) return 'not_started'
  if (masteryEligible && done && distinctUtcDays(scorables.map((s) => s.attemptedAt)) >= 2) {
    return 'retained'
  }
  if (done && hasObjective) return 'ready_for_transfer'
  return 'learning'
}

export function showNeedsEvidenceBadge(diagnostic: TargetResult | undefined): boolean {
  return diagnostic?.status === 'needs_evidence'
}
