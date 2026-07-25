/**
 * Derives which targets get promoted to `status: 'priority'` from a
 * diagnostic run's already-scored `TargetResult[]` (plan 067, step 5).
 *
 * This module never re-scores anything — `scoring.ts` (step 4) owns
 * per-target `status`/`confidence`/`measurement`. This module only performs
 * the cross-target ranking that `scoring.ts` explicitly deferred.
 *
 * Heuristic (deliberately simple and documented, not final product ranking
 * science — consistent with the tone of `scoring.ts`):
 * - Only `status: 'observed'` results are eligible at all. `'strength'`
 *   results are, by definition, already at/above the strength threshold —
 *   promoting them to `'priority'` would tell the learner to drill something
 *   they've already demonstrated ("known strong targets are not
 *   over-prioritized" per the plan). `'needs_evidence'` results (which is
 *   what `scoring.ts` assigns to `not_measured`/`failed` measurements) mean
 *   we have no reliable signal yet — prioritizing practice off zero evidence
 *   isn't prioritization, it's a guess, so those stay `'needs_evidence'` and
 *   should drive the learner toward *gathering* evidence, not toward a
 *   priority-labeled drill.
 * - Among eligible `'observed'` results, rank by a composite score that
 *   rewards (a) higher confidence (we trust the measurement) and (b) larger
 *   error severity, i.e. how far the score sits below the strength
 *   threshold (a 40/100 is a stronger priority candidate than a 78/100).
 *   Confidence gates severity rather than just adding to it — a
 *   low-confidence low score should not outrank a high-confidence
 *   moderate-low score, since acting on shaky evidence is exactly what the
 *   plan's "low-confidence results request more evidence" verify bullet
 *   guards against.
 * - Ties are broken by transfer value: a target with more registry
 *   prerequisites resolving *through* it (i.e. more targets that list it,
 *   directly or transitively, as a prerequisite) unblocks more downstream
 *   practice, so it wins the tiebreak. This is a coarse proxy, not a full
 *   graph-centrality algorithm — intentionally so.
 * - Capped at 3, per schema (`PronunciationDiagnosticResultSchema` also
 *   enforces this, but callers should not rely solely on the schema to
 *   catch a logic bug here).
 */

import { listTargets, resolvePrerequisiteChain } from '@/lib/pronunciation/targets/registry'
import type { PronunciationTargetId } from '@/lib/pronunciation/targets/types'
import type { TargetResult } from './types'

/** Must match `scoring.ts`'s STRENGTH_SCORE_THRESHOLD — duplicated here deliberately since
 * step 5 owns real thresholding per that file's own comment; kept in sync by the shared test
 * suite rather than a shared import, to avoid coupling ranking to scoring's internal constant. */
const STRENGTH_SCORE_THRESHOLD = 80

const MAX_PRIORITIES = 3

/**
 * How many other registry targets transitively depend on `targetId` as a
 * prerequisite. Used only as a tiebreaker — a coarse "unblocks more stuff"
 * proxy for transfer value, not a real graph-centrality metric.
 */
function downstreamUnlockCount(targetId: string): number {
  let count = 0
  for (const candidate of listTargets()) {
    if (candidate.id === targetId) continue
    const chain = resolvePrerequisiteChain(candidate.id as PronunciationTargetId)
    if (chain.includes(targetId as PronunciationTargetId)) count += 1
  }
  return count
}

/** Composite priority-candidacy score for one eligible ('observed') result. Higher = more urgent. */
function candidateScore(result: TargetResult): number {
  if (result.measurement.kind !== 'scored') return 0
  const severity = Math.max(0, STRENGTH_SCORE_THRESHOLD - result.measurement.score)
  // Confidence gates severity multiplicatively so shaky evidence never outranks trustworthy evidence.
  return severity * result.confidence
}

/**
 * Returns the set of target ids from `results` that should be promoted to
 * `status: 'priority'`, capped at `MAX_PRIORITIES`. Does not mutate
 * `results` — callers combine this with the original array (see
 * `applyPriorityStatus`) or use it directly for prescription generation.
 */
export function derivePriorityTargetIds(results: readonly TargetResult[]): string[] {
  const eligible = results.filter(
    (r) =>
      r.status === 'observed' &&
      r.measurement.kind === 'scored' &&
      candidateScore(r) > 0
  )

  const ranked = [...eligible].sort((a, b) => {
    const scoreDiff = candidateScore(b) - candidateScore(a)
    if (scoreDiff !== 0) return scoreDiff
    return downstreamUnlockCount(b.targetId) - downstreamUnlockCount(a.targetId)
  })

  return ranked.slice(0, MAX_PRIORITIES).map((r) => r.targetId)
}

/**
 * Returns a new `TargetResult[]` with the derived priority target ids'
 * `status` updated to `'priority'`. Every other result is returned
 * unchanged (same object reference) — this function only touches the
 * promoted subset.
 */
export function applyPriorityStatus(results: readonly TargetResult[]): TargetResult[] {
  const priorityIds = new Set(derivePriorityTargetIds(results))
  return results.map((result) => (priorityIds.has(result.targetId) ? { ...result, status: 'priority' as const } : result))
}
