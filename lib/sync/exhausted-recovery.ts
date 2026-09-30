/**
 * Plan 045 — requeue outbox entries that were parked only because their
 * transient retries ran out (`failureKind: 'exhausted'`), e.g. a flaky
 * connection that failed MAX_RETRIES times in a row.
 *
 * Runs on reconnection / auth restoration (see init-sync-listeners.ts) and is
 * bounded three ways: per user (only the active account's entries), per entry
 * (MAX_FAILED_RECOVERIES, with backoff from the last attempt) and per pass
 * (maxEntries). Server rejections — RLS, CHECK, invalid payload — are
 * `permanent` and never enter this path; auth failures are excluded even when
 * exhausted, because a resend cannot succeed without a new session.
 *
 * Entries parked before plan 045 have no `failureKind`; only uncoded failures
 * whose message is a browser network error are treated as exhausted.
 * Skill-model bundles are requeued whole or not at all, so a parent row is
 * never resent without its children (or vice versa).
 */

import { db } from '@/lib/db'
import {
  MAX_FAILED_RECOVERIES,
  isFailedRecoveryDue,
  requeueFailedEntries,
} from './recovery'
import { MAX_RETRIES } from './sync-manager'
import type { SyncOutboxEntry } from './types'

export const MAX_EXHAUSTED_RECOVERIES = MAX_FAILED_RECOVERIES

const EXHAUSTED_RECOVERY_DELAYS_MS = [5 * 60_000, 60 * 60_000, 6 * 60 * 60_000] as const
const DEFAULT_MAX_ENTRIES = 30
const AUTH_ERROR_CODES: ReadonlySet<string> = new Set(['PGRST301', 'PGRST302', '401', '403'])
const NETWORK_ERROR_MESSAGE = /failed to fetch|networkerror|network request failed|load failed|fetch failed/i

export interface ExhaustedRecoveryOptions {
  maxEntries?: number
  now?: number
}

export function isExhaustedTransientFailure(entry: SyncOutboxEntry): boolean {
  if (entry.status !== 'failed') return false
  if (entry.errorCode && AUTH_ERROR_CODES.has(entry.errorCode)) return false
  if (entry.failureKind) return entry.failureKind === 'exhausted'
  return !entry.errorCode
    && entry.retryCount >= MAX_RETRIES
    && NETWORK_ERROR_MESSAGE.test(entry.errorMessage ?? '')
}

function groupByBundle(entries: SyncOutboxEntry[]): SyncOutboxEntry[][] {
  const bundles = new Map<string, SyncOutboxEntry[]>()
  for (const entry of entries) {
    const key = entry.bundleId ?? `entry:${entry.id}`
    bundles.set(key, [...(bundles.get(key) ?? []), entry])
  }
  return [...bundles.values()]
}

export async function recoverExhaustedEntries(
  userId: string,
  options: ExhaustedRecoveryOptions = {},
): Promise<{ requeued: number }> {
  const now = options.now ?? Date.now()
  const limit = options.maxEntries ?? DEFAULT_MAX_ENTRIES
  const failed = (await db.syncOutbox.where('userId').equals(userId).toArray())
    .filter((entry) => entry.status === 'failed')

  const ids: number[] = []
  for (const bundle of groupByBundle(failed)) {
    const eligible = bundle.every((entry) =>
      isExhaustedTransientFailure(entry)
      && isFailedRecoveryDue(entry, now, EXHAUSTED_RECOVERY_DELAYS_MS))
    if (!eligible || ids.length + bundle.length > limit) continue
    ids.push(...bundle.map((entry) => entry.id!))
  }
  return { requeued: await requeueFailedEntries(ids) }
}
