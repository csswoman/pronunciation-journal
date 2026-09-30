/**
 * Plan 045 — recover `answer_history` outbox entries that the server rejected
 * only because its context CHECK lagged the client.
 *
 * Eligible entries, all for the active user:
 *  - table `answer_history`, status `failed`;
 *  - rejected by `answer_history_context_check` (23514, or a legacy uncoded
 *    failure whose message names that exact constraint) — a 23514 from any
 *    other constraint stays parked;
 *  - `payload.context` is one whose repair ships in
 *    supabase/migrations/20260926230000_answer_history_essential_words_context.sql;
 *  - `payload.id` is a uuid (the column type), so the resend can succeed.
 *
 * Only the answer row is requeued: id, createdAt and payload are kept, and the
 * sibling SRS entries (word_bank / topic_srs RPCs, skill-model rows) written in
 * the same local transaction are never touched, so recovery cannot replay a
 * rating. `answered_at` is stamped from the entry's createdAt when missing so
 * a late sync does not move the answer to the recovery day.
 *
 * If the remote CHECK is still unrepaired, the resend fails with the same
 * 23514 and the entry returns to `failed`; each entry is retried at most
 * MAX_FAILED_RECOVERIES times with growing backoff, never in a loop.
 */

import { db } from '@/lib/db'
import {
  MAX_FAILED_RECOVERIES,
  isFailedRecoveryDue,
  requeueFailedEntries,
} from './recovery'
import type { SyncOutboxEntry } from './types'

export const MAX_ANSWER_RECOVERIES = MAX_FAILED_RECOVERIES

/** Contexts whose CHECK repair ships with this client. */
export const REPAIRED_ANSWER_CONTEXTS: ReadonlySet<string> = new Set(['essential-words'])

const CONTEXT_CHECK = 'answer_history_context_check'
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
/** First recovery is immediate (a repair, not a transient error); then 1 h, 6 h. */
const ANSWER_RECOVERY_DELAYS_MS = [0, 60 * 60_000, 6 * 60 * 60_000] as const
const DEFAULT_MAX_ENTRIES = 50

export interface AnswerRecoveryOptions {
  maxEntries?: number
  now?: number
}

export interface AnswerRecoveryResult {
  requeued: number
}

export function isRepairedAnswerContextFailure(entry: SyncOutboxEntry): boolean {
  if (entry.status !== 'failed' || entry.table !== 'answer_history') return false
  if (entry.operation !== 'upsert' && entry.operation !== 'insert') return false
  const namesConstraint = `${entry.errorMessage ?? ''} ${entry.errorDetails ?? ''}`.includes(CONTEXT_CHECK)
  const byCheck = entry.errorCode === '23514' || (!entry.errorCode && Boolean(entry.errorMessage))
  if (!namesConstraint || !byCheck) return false
  const payload = entry.payload as Record<string, unknown>
  return REPAIRED_ANSWER_CONTEXTS.has(String(payload.context)) && UUID_RE.test(String(payload.id))
}

function withOriginalAnsweredAt(entry: SyncOutboxEntry): Record<string, unknown> {
  const payload = entry.payload as Record<string, unknown>
  return payload.answered_at == null ? { ...payload, answered_at: entry.createdAt } : payload
}

/** Candidates for the active user, oldest first; used by recovery and diagnostics. */
export async function listRepairedAnswerFailures(userId: string): Promise<SyncOutboxEntry[]> {
  const entries = await db.syncOutbox.where('userId').equals(userId).toArray()
  return entries
    .filter(isRepairedAnswerContextFailure)
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
}

export async function recoverRepairedAnswerFailures(
  userId: string,
  options: AnswerRecoveryOptions = {},
): Promise<AnswerRecoveryResult> {
  const now = options.now ?? Date.now()
  const due = (await listRepairedAnswerFailures(userId))
    .filter((entry) => isFailedRecoveryDue(entry, now, ANSWER_RECOVERY_DELAYS_MS))
    .slice(0, options.maxEntries ?? DEFAULT_MAX_ENTRIES)
  const requeued = await requeueFailedEntries(due.map((entry) => entry.id!), withOriginalAnsweredAt)
  return { requeued }
}
