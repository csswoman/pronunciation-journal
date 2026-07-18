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
