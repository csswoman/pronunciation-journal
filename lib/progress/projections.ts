import type { EvidenceModality } from '@/lib/practice/attribution'

export type ProgressSignal =
  | 'exposure'
  | 'completion'
  | 'intent'
  | 'objective_evidence'
  | 'transfer'

export interface ProgressFact {
  id: string
  signal: ProgressSignal
  occurredAt: string
  targetId?: string
  correct?: boolean
  exercises?: number
  durationMs?: number
  provenance: string
  modality?: EvidenceModality
}

export interface ProgressProjections {
  activity: {
    sessions: number
    exercises: number
    durationMs: number
    activeDays: number
  }
  coverage: {
    encountered: number
    completed: number
  }
  learning: {
    evidencedTargets: number
    reviewTargets: number
    transferTargets: number
    evidence: Array<Pick<ProgressFact, 'id' | 'targetId' | 'correct' | 'provenance' | 'modality' | 'occurredAt'>>
  }
}

/** Pre-aggregated activity/coverage totals computed in SQL, bypassing the fact-derived walk. */
export interface PrecomputedProjectionTotals {
  activity: {
    sessions: number
    exercises: number
    durationMs: number
    activeDays: number
  }
  /**
   * `encountered` and `completed` collapse to the same count for current callers
   * because getProgressProjections' only coverage-producing signal is `completion`
   * (lesson_completions) — it never emits `exposure` facts. If that changes, this
   * needs a separate `encounteredCount` field.
   */
  completedCount: number
}

/**
 * Pure read-model boundary. Activity and coverage remain visible but cannot
 * raise learning unless the fact carries objective or transfer evidence.
 *
 * When `precomputed` is provided, activity/coverage totals come from it
 * directly (SQL aggregates) and `facts` is expected to contain only
 * evidence-bearing facts (objective_evidence / transfer) — session and
 * completion facts are not needed in that mode. When omitted, activity/
 * coverage are derived from `facts` as before (back-compat for existing
 * callers/tests).
 */
export function projectProgress(
  facts: readonly ProgressFact[],
  precomputed?: PrecomputedProjectionTotals,
): ProgressProjections {
  const activeDays = new Set<string>()
  const covered = new Set<string>()
  const completed = new Set<string>()
  const latestByTarget = new Map<string, ProgressFact>()
  const transferTargets = new Set<string>()
  let sessions = 0
  let exercises = 0
  let durationMs = 0

  for (const fact of facts) {
    if (!precomputed) {
      if (fact.exercises !== undefined || fact.durationMs !== undefined) {
        sessions++
        exercises += fact.exercises ?? 0
        durationMs += fact.durationMs ?? 0
        activeDays.add(fact.occurredAt.slice(0, 10))
      }

      if (fact.signal === 'exposure' || fact.signal === 'completion') covered.add(fact.id)
      if (fact.signal === 'completion') completed.add(fact.id)
    }

    if ((fact.signal === 'objective_evidence' || fact.signal === 'transfer') && fact.targetId) {
      const previous = latestByTarget.get(fact.targetId)
      if (!previous || previous.occurredAt <= fact.occurredAt) latestByTarget.set(fact.targetId, fact)
      if (fact.signal === 'transfer' && fact.correct) transferTargets.add(fact.targetId)
    }
  }

  const evidence = [...latestByTarget.values()]
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
    .map(({ id, targetId, correct, provenance, modality, occurredAt }) => ({
      id, targetId, correct, provenance, modality, occurredAt,
    }))

  return {
    activity: precomputed
      ? precomputed.activity
      : { sessions, exercises, durationMs, activeDays: activeDays.size },
    coverage: precomputed
      ? { encountered: precomputed.completedCount, completed: precomputed.completedCount }
      : { encountered: covered.size, completed: completed.size },
    learning: {
      evidencedTargets: evidence.filter((fact) => fact.correct).length,
      reviewTargets: evidence.filter((fact) => fact.correct === false).length,
      transferTargets: transferTargets.size,
      evidence,
    },
  }
}
