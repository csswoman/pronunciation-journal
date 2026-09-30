/**
 * Plan 045 — local, read-only snapshot of why outbox entries are not syncing.
 * Surfaced through `window.__syncRecovery.getSyncFailureDiagnostics()` (see
 * schema-failure-recovery.ts) and logged by init-sync-listeners.ts when a
 * recovery pass requeues entries. Never sends anything remotely.
 */

import { db } from '@/lib/db'
import { isRepairedAnswerContextFailure } from './answer-recovery'
import { isExhaustedTransientFailure } from './exhausted-recovery'
import { MAX_FAILED_RECOVERIES } from './recovery'

export interface SyncFailureDiagnostics {
  pending: number
  failed: number
  /** Server rejections that no automatic path will retry. */
  permanent: number
  /** Transient exhaustion still eligible for reconnection recovery. */
  exhaustedRecoverable: number
  /** answer_history rows whose CHECK repair ships with this client. */
  repairableAnswers: number
  /** Entries that already used every allowed recovery. */
  recoveryCapReached: number
  /** Failed entries per `table:errorCode` (`uncoded` when absent). */
  failedByCause: Record<string, number>
}

export async function getSyncFailureDiagnostics(userId: string): Promise<SyncFailureDiagnostics> {
  const entries = await db.syncOutbox.where('userId').equals(userId).toArray()
  const failed = entries.filter((entry) => entry.status === 'failed')
  const failedByCause: Record<string, number> = {}
  for (const entry of failed) {
    const cause = `${entry.table}:${entry.errorCode ?? 'uncoded'}`
    failedByCause[cause] = (failedByCause[cause] ?? 0) + 1
  }
  const capReached = (count?: number) => (count ?? 0) >= MAX_FAILED_RECOVERIES
  const exhausted = failed.filter(isExhaustedTransientFailure)
  const repairable = failed.filter(isRepairedAnswerContextFailure)

  return {
    pending: entries.filter((entry) => entry.status === 'pending').length,
    failed: failed.length,
    permanent: failed.length - exhausted.length - repairable.length,
    exhaustedRecoverable: exhausted.filter((entry) => !capReached(entry.recoveryCount)).length,
    repairableAnswers: repairable.filter((entry) => !capReached(entry.recoveryCount)).length,
    recoveryCapReached: failed.filter((entry) => capReached(entry.recoveryCount)).length,
    failedByCause,
  }
}
