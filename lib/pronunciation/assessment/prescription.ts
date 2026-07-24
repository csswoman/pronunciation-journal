/**
 * Generates the five-session first-week prescription from a diagnostic
 * run's (post-prioritization) `TargetResult[]` (plan 067, step 5).
 *
 * Session-to-style mapping: the plan's spec describes a five-stage
 * progression — model demonstration → perception → controlled production →
 * varied phrase practice → mission transfer — but
 * `PrescriptionSessionStyleSchema` only has three values (`drill | perception
 * | transfer`). We map:
 *   1. model            -> 'perception'  (learner listens/discriminates before producing)
 *   2. perception       -> 'perception'  (forced-choice discrimination proper)
 *   3. controlled prod.  -> 'drill'       (isolated, repeatable practice)
 *   4. varied phrase     -> 'drill'       (same style, richer/varied material)
 *   5. mission transfer  -> 'transfer'    (contextual, real-use application)
 * This guarantees exactly one 'transfer' session (session 5) and keeps the
 * ordering meaningful even though the schema's enum is coarser than the
 * spec's five-stage narrative. Documented here since it's a deliberate,
 * lossy mapping choice, not an accident.
 *
 * Fallback behavior: a diagnostic run may produce fewer than 3 priority
 * targets (or none at all — e.g. everything came back `not_measured`). The
 * generator must still emit exactly 5 valid sessions. We build a fallback
 * candidate list, in order of preference:
 *   1. priority targets (status === 'priority')
 *   2. observed targets (evidence exists, not yet a priority or strength)
 *   3. needs_evidence targets (revisit to gather more evidence)
 *   4. strength targets (safe last resort — light maintenance practice)
 * and cycle through that list (repeating targets from multiple angles) to
 * fill all 5 session slots. This keeps every session tied to a real,
 * registry-valid target instead of inventing placeholder ids.
 */

import { getTarget, listTargets } from '@/lib/pronunciation/targets/registry'
import { getLearnerTargetCopy } from './learner-copy'
import type { PrescriptionSession, PrescriptionSessionStyle } from './schema'
import type { TargetResult, TargetResultStatus } from './types'

const SESSION_STYLES: readonly PrescriptionSessionStyle[] = [
  'perception',
  'perception',
  'drill',
  'drill',
  'transfer',
]

/** Spanish stage reasons — UI chrome; learning content stays in speak cues elsewhere. */
const SESSION_REASON_BY_INDEX: readonly string[] = [
  'Escucha un modelo con atención antes de intentarlo tú.',
  'Practica distinguir este sonido de otros parecidos.',
  'Repítelo en un ejercicio corto y controlado.',
  'Úsalo en varias frases distintas, no solo en una palabra memorizada.',
  'Llévalo a una tarea real para que pase a tu conversación.',
]

/** Preference order used to fill session slots when there are fewer than 5 usable candidates. */
const FALLBACK_STATUS_ORDER: readonly TargetResultStatus[] = [
  'priority',
  'observed',
  'needs_evidence',
  'strength',
]

/**
 * Builds the ordered candidate target-id list sessions draw from: priority
 * targets first, then progressively less-urgent statuses, so we always have
 * *something* to cycle through even in a near-empty diagnostic run.
 */
function buildCandidateTargetIds(results: readonly TargetResult[]): string[] {
  const byStatus = new Map<TargetResultStatus, string[]>()
  for (const result of results) {
    const list = byStatus.get(result.status) ?? []
    list.push(result.targetId)
    byStatus.set(result.status, list)
  }

  const ordered: string[] = []
  for (const status of FALLBACK_STATUS_ORDER) {
    ordered.push(...(byStatus.get(status) ?? []))
  }
  return ordered.filter((targetId) => getTarget(targetId).ok)
}

function reasonFor(sessionIndex: number, targetId: string, status: TargetResultStatus | null): string {
  const stageReason = SESSION_REASON_BY_INDEX[sessionIndex] ?? SESSION_REASON_BY_INDEX[0]!
  const { title } = getLearnerTargetCopy(targetId)
  const statusNote =
    status === 'priority'
      ? ' Es uno de tus focos principales ahora.'
      : status === 'needs_evidence'
        ? ' Primero necesitamos más evidencia de cómo lo manejas.'
        : ''
  // 300-char cap enforced by PrescriptionSessionSchema — keep this comfortably short.
  return `${title}: ${stageReason}${statusNote}`.slice(0, 300)
}

/**
 * Generates exactly 5 `PrescriptionSession`s from a diagnostic run's target
 * results. Expects `results` to already reflect priority status (i.e. run
 * through `applyPriorityStatus` first) — this function does not derive
 * priorities itself, keeping ranking and session-shaping independently
 * testable.
 *
 * Throws only if the registry has zero targets at all (a configuration
 * error, not a runtime data issue) — every other input, including an empty
 * `results` array, falls back to cycling registry targets so 5 valid
 * sessions are always produced.
 */
export function generatePrescriptionSessions(results: readonly TargetResult[]): PrescriptionSession[] {
  const statusByTargetId = new Map(results.map((r) => [r.targetId, r.status] as const))
  let candidates = buildCandidateTargetIds(results)

  if (candidates.length === 0) {
    // Ultimate fallback: no usable results at all (e.g. empty diagnostic run).
    // Fall back to registry targets directly rather than crashing.
    candidates = listTargets().map((t) => t.id)
  }

  if (candidates.length === 0) {
    throw new Error('generatePrescriptionSessions: pronunciation target registry is empty')
  }

  const sessions: PrescriptionSession[] = []
  for (let i = 0; i < 5; i++) {
    const targetId = candidates[i % candidates.length] as string
    sessions.push({
      targetId,
      reason: reasonFor(i, targetId, statusByTargetId.get(targetId) ?? null),
      style: SESSION_STYLES[i] as PrescriptionSessionStyle,
    })
  }
  return sessions
}
