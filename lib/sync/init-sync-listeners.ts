import { flushOutbox } from './sync-manager'
import { getEarliestPendingRetryAt } from './recovery'
import { exposeSyncRecoveryDevTools } from './schema-failure-recovery'

let removeOnlineListener: (() => void) | undefined
let retryTimer: ReturnType<typeof setTimeout> | undefined

function clearRetryTimer(): void {
  if (retryTimer) {
    clearTimeout(retryTimer)
    retryTimer = undefined
  }
}

/**
 * Drain the outbox for `userId`, then schedule exactly one `setTimeout` for
 * the earliest remaining `nextRetryAt` (if any) so transiently-failed
 * entries retry automatically without polling.
 *
 * Deliberately does NOT schedule a timer while offline: a flush attempted
 * while `navigator.onLine` is false immediately no-ops in
 * `flushOutboxInternal` (see sync-manager.ts), so scheduling a retry timer
 * for that moment would just busy-wait until connectivity returns. The
 * `online` listener already re-drains the instant connectivity is restored,
 * so offline periods rely on that event instead of a timer.
 */
async function drainAndReschedule(userId: string): Promise<void> {
  clearRetryTimer()
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return

  await flushOutbox(userId)

  if (typeof navigator !== 'undefined' && navigator.onLine === false) return

  const nextRetryAt = await getEarliestPendingRetryAt(userId)
  if (!nextRetryAt) return

  const delayMs = Math.max(0, new Date(nextRetryAt).getTime() - Date.now())
  retryTimer = setTimeout(() => { void drainAndReschedule(userId) }, delayMs)
}

/**
 * Registers sync listeners for `userId` and returns a cleanup safe for
 * remounts. Triggers an immediate drain (covers "drain after auth
 * restoration" — pending entries don't wait for the next `online` event),
 * keeps draining on `online`, and schedules a precise timer for the next
 * retry-due entry after each pass (see `drainAndReschedule`).
 *
 * Multi-tab coordination: relies on the existing safe-concurrent-claim
 * mechanism in `flushOutboxInternal` (pending → syncing claim inside a
 * Dexie transaction, plus `reclaimStaleSyncingEntries` as a crash safety
 * net) rather than electing a single "owner" tab via the Web Locks API.
 * Each tab may independently schedule its own retry timer and redundantly
 * attempt to claim already-`syncing` rows — that's wasted work, not unsafe
 * work, since a claim only succeeds once. True election was judged to be
 * over-engineering for the marginal benefit of skipping a few no-op claims;
 * see plan 061 step 5 report for the full reasoning.
 */
export function initSyncListeners(userId: string | null = null): () => void {
  if (typeof window === 'undefined') return () => {}
  if (removeOnlineListener) return removeOnlineListener

  if (userId) exposeSyncRecoveryDevTools(userId)
  if (userId) void drainAndReschedule(userId)

  const onOnline = () => { if (userId) void drainAndReschedule(userId) }
  window.addEventListener('online', onOnline)
  removeOnlineListener = () => {
    window.removeEventListener('online', onOnline)
    removeOnlineListener = undefined
    clearRetryTimer()
  }
  return removeOnlineListener
}
