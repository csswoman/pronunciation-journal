'use client'

/**
 * Offline-first inputs for the pronunciation path.
 * SpokenAttempt projection is intentionally empty until a targetId-keyed
 * store is queryable — states then rely on completions + diagnostic.
 */

import { db } from '@/lib/db'
import { getLocalPronunciationAssessments } from '@/lib/pronunciation/assessment/persistence'
import { validateDiagnosticResult } from '@/lib/pronunciation/assessment/schema'
import type { TargetResult } from '@/lib/pronunciation/assessment/types'
import { CONTENT_MAP } from '@/lib/pronunciation/targets/content-map'
import type { PathSpokenEvidence } from './unit-state'

export interface PathEvidenceBundle {
  completedContentKeys: Set<string>
  spokenAttempts: PathSpokenEvidence[]
  diagnosticPriorityIds: string[]
  diagnosticByTargetId: Map<string, TargetResult>
}

export async function loadPathEvidence(userId: string): Promise<PathEvidenceBundle> {
  const [lessons, assessments] = await Promise.all([
    db.completedLessons.where('userId').equals(userId).toArray(),
    getLocalPronunciationAssessments(userId),
  ])

  const completedSlugs = new Set(lessons.map((row) => row.lessonSlug))
  const completedContentKeys = new Set<string>()
  for (const entry of CONTENT_MAP) {
    if (completedSlugs.has(entry.slug)) {
      completedContentKeys.add(`${entry.kind}:${entry.slug}`)
    }
  }

  const diagnosticByTargetId = new Map<string, TargetResult>()
  let diagnosticPriorityIds: string[] = []
  const latest = assessments[0]
  if (latest) {
    const validated = validateDiagnosticResult(latest.result)
    if (validated.ok) {
      for (const row of validated.result.targetResults) {
        diagnosticByTargetId.set(row.targetId, row)
      }
      diagnosticPriorityIds = validated.result.targetResults
        .filter((r) => r.status === 'priority')
        .map((r) => r.targetId)
    }
  }

  return {
    completedContentKeys,
    spokenAttempts: [],
    diagnosticPriorityIds,
    diagnosticByTargetId,
  }
}
