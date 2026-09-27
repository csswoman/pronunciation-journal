import Dexie from 'dexie'
import { db } from '@/lib/db'
import type { SyncOutboxEntry } from './types'

export const SYNCING_STALE_MS = 2 * 60 * 1000

const RETRY_DELAYS_MS = [5_000, 30_000, 2 * 60_000]

export function getNextRetryAt(retryCount: number, attemptedAt: string): string {
  const delay = RETRY_DELAYS_MS[Math.min(retryCount - 1, RETRY_DELAYS_MS.length - 1)]
  return new Date(new Date(attemptedAt).getTime() + delay).toISOString()
}

export function isReadyToRetry(nextRetryAt: string | undefined, currentTime: number): boolean {
  return !nextRetryAt || new Date(nextRetryAt).getTime() <= currentTime
}

/** Releases entries left in `syncing` by a crashed or closed tab. */
export async function reclaimStaleSyncingEntries(currentTime = Date.now()): Promise<number> {
  const staleBefore = new Date(currentTime - SYNCING_STALE_MS).toISOString()
  return db.syncOutbox
    .where('status')
    .equals('syncing')
    .filter((entry) => Boolean(entry.lastAttemptAt && entry.lastAttemptAt < staleBefore))
    .modify({ status: 'pending' })
}

/**
 * Find the earliest moment a `pending` entry for this user becomes ready to
 * retry, so callers can schedule exactly one `setTimeout` for that instant
 * instead of polling. Entries with no `nextRetryAt` are already ready (they
 * were never attempted, or `isReadyToRetry` already lets them through) —
 * those don't need a timer, a flush should just run now for them. Returns
 * `null` when there is nothing scheduled for the future (either no pending
 * entries at all, or all pending entries are already ready now).
 */
export async function getEarliestPendingRetryAt(userId: string): Promise<string | null> {
  const pending = await db.syncOutbox
    .where('[userId+status+createdAt]')
    .between([userId, 'pending', Dexie.minKey], [userId, 'pending', Dexie.maxKey])
    .toArray()

  let earliest: string | null = null
  for (const entry of pending) {
    if (!entry.nextRetryAt) continue // ready now, not a future retry
    if (isReadyToRetry(entry.nextRetryAt, Date.now())) continue // already ready now
    if (!earliest || entry.nextRetryAt < earliest) earliest = entry.nextRetryAt
  }
  return earliest
}

// ── Bounded recovery of `failed` entries (plan 045) ──────────────────────────

/** Each failed entry may be requeued at most this many times, ever. */
export const MAX_FAILED_RECOVERIES = 3

/**
 * Whether a failed entry may be requeued at `currentTime`: under the per-entry
 * cap and past the backoff for its next recovery (`delaysMs[recoveryCount]`,
 * measured from its last remote attempt).
 */
export function isFailedRecoveryDue(
  entry: SyncOutboxEntry,
  currentTime: number,
  delaysMs: readonly number[],
): boolean {
  const count = entry.recoveryCount ?? 0
  if (count >= MAX_FAILED_RECOVERIES) return false
  const lastAttempt = new Date(entry.lastAttemptAt ?? entry.createdAt).getTime()
  return lastAttempt + delaysMs[Math.min(count, delaysMs.length - 1)] <= currentTime
}

/**
 * Move still-`failed` entries back to `pending` in one Dexie write, keeping
 * their id, createdAt and payload. Re-checking `status` inside the write makes
 * concurrent recoveries (two tabs, double call) count each entry once.
 */
export async function requeueFailedEntries(
  ids: number[],
  patchPayload?: (entry: SyncOutboxEntry) => Record<string, unknown>,
): Promise<number> {
  if (ids.length === 0) return 0
  return db.syncOutbox
    .where('id')
    .anyOf(ids)
    .filter((entry) => entry.status === 'failed')
    .modify((entry) => {
      if (patchPayload) entry.payload = patchPayload(entry)
      entry.status = 'pending'
      entry.retryCount = 0
      entry.recoveryCount = (entry.recoveryCount ?? 0) + 1
      delete entry.nextRetryAt
      delete entry.failureKind
      delete entry.errorMessage
      delete entry.errorCode
      delete entry.errorDetails
      delete entry.errorHint
    })
}
