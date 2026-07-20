import Dexie from 'dexie'
import { db } from '@/lib/db'

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
