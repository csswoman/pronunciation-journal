'use client'

/**
 * Offline-first inputs for the pronunciation path.
 * SpokenAttempt projection is intentionally empty until a targetId-keyed
 * store is queryable — states then rely on completions + diagnostic.
 */

import { db } from '@/lib/db'
import { readGuestPronunciationDiagnostic } from '@/lib/pronunciation/assessment/guest-transfer'
import { getLocalPronunciationAssessments } from '@/lib/pronunciation/assessment/persistence'
import { hydratePronunciationAssessments } from '@/lib/pronunciation/assessment/queries'
import {
  validateDiagnosticResult,
  type PronunciationDiagnosticResult,
} from '@/lib/pronunciation/assessment/schema'
import type { TargetResult } from '@/lib/pronunciation/assessment/types'
import { CONTENT_MAP } from '@/lib/pronunciation/targets/content-map'
import { getPathUnit } from './curriculum'
import type { PathSpokenEvidence } from './unit-state'

export interface PathEvidenceBundle {
  completedContentKeys: Set<string>
  spokenAttempts: PathSpokenEvidence[]
  diagnosticPriorityIds: string[]
  diagnosticByTargetId: Map<string, TargetResult>
}

function focusIdsFromDiagnostic(result: PronunciationDiagnosticResult): string[] {
  const dayOne = result.prescription.sessions[0]?.targetId
  const priorities = result.targetResults
    .filter((r) => r.status === 'priority')
    .map((r) => r.targetId)

  const ordered: string[] = []
  for (const id of [dayOne, ...priorities]) {
    if (!id) continue
    if (!getPathUnit(id)) continue
    if (ordered.includes(id)) continue
    ordered.push(id)
  }
  return ordered
}

function bundleFromDiagnostic(
  result: PronunciationDiagnosticResult | null,
  completedContentKeys: Set<string>, spokenAttempts: PathSpokenEvidence[] = []
): PathEvidenceBundle {
  const diagnosticByTargetId = new Map<string, TargetResult>()
  let diagnosticPriorityIds: string[] = []

  if (result) {
    for (const row of result.targetResults) {
      diagnosticByTargetId.set(row.targetId, row)
    }
    diagnosticPriorityIds = focusIdsFromDiagnostic(result)
  }

  return {
    completedContentKeys,
    spokenAttempts,
    diagnosticPriorityIds,
    diagnosticByTargetId,
  }
}

async function completedKeysForUser(userId: string): Promise<Set<string>> {
  const lessons = await db.completedLessons.where('userId').equals(userId).toArray()
  const completedSlugs = new Set(lessons.map((row) => row.lessonSlug))
  const completedContentKeys = new Set<string>()
  for (const entry of CONTENT_MAP) {
    if (completedSlugs.has(entry.slug)) {
      completedContentKeys.add(`${entry.kind}:${entry.slug}`)
    }
  }
  return completedContentKeys
}

/**
 * Loads path evidence for the pronunciation route.
 * - Authenticated: claim guest → hydrate remote → Dexie mirror
 * - Guest: localStorage diagnostic (same snapshot the results CTA used)
 */
export async function loadPathEvidence(userId?: string | null): Promise<PathEvidenceBundle> {
  if (userId) {
    try {
      const { claimGuestPronunciationDiagnostic } = await import(
        '@/lib/pronunciation/assessment/guest-transfer'
      )
      await claimGuestPronunciationDiagnostic(userId)
    } catch {
      // Claim is best-effort; local/remote hydrate still runs.
    }

    try {
      await hydratePronunciationAssessments(userId)
    } catch {
      // Offline or missing table — Dexie/guest still usable.
    }

    const [completedContentKeys, assessments, feedbackEvidence] = await Promise.all([
      completedKeysForUser(userId),
      getLocalPronunciationAssessments(userId),
      db.pronunciationFeedbackEvidence.where('userId').equals(userId).toArray(),
    ])
    const spokenAttempts = feedbackEvidence.filter((row) => row.outcome !== 'unscored').map((row) => ({ targetId: row.targetId, outcome: 'scored' as const, attemptedAt: row.occurredAt }))

    const latest = assessments[0]
    if (latest) {
      const validated = validateDiagnosticResult(latest.result)
      if (validated.ok) {
        return bundleFromDiagnostic(validated.result, completedContentKeys, spokenAttempts)
      }
    }

    // Dexie empty/invalid — fall through to guest snapshot still on device.
    const guest = readGuestPronunciationDiagnostic()
    return bundleFromDiagnostic(guest, completedContentKeys, spokenAttempts)
  }

  const guest = readGuestPronunciationDiagnostic()
  return bundleFromDiagnostic(guest, new Set())
}
