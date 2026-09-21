/**
 * Detects whether a learner is avoiding oral missions: abandoning them
 * before completion rather than simply not being offered one.
 *
 * Pure module: no I/O, no Dexie import here — the caller (composer.ts, via
 * `loadRecentMissionSessions`) supplies the data so this stays testable
 * without a browser/IndexedDB environment.
 */

export type MissionSessionStatus = 'in_progress' | 'completed' | 'cancelled' | 'provider_error'

export interface MissionSessionSummary {
  status: MissionSessionStatus
  /** ISO timestamp — used only to determine recency order. */
  startedAt: string
}

/** How many most-recent sessions to inspect. */
const AVOIDANCE_WINDOW = 2

/**
 * True only when the learner's last AVOIDANCE_WINDOW missions were all
 * explicitly cancelled (abandoned mid-mission) — not merely absent,
 * in-progress, or failed for provider reasons outside the learner's control.
 *
 * A single cancellation is not avoidance: missions get interrupted by
 * ordinary life. Two in a row, with nothing completed in between, is the
 * signal that the current mission length/friction is the problem.
 */
export function recentMissionAvoidance(sessions: readonly MissionSessionSummary[]): boolean {
  if (sessions.length < AVOIDANCE_WINDOW) return false

  const sorted = [...sessions].sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
  )
  const mostRecent = sorted.slice(0, AVOIDANCE_WINDOW)
  return mostRecent.every((session) => session.status === 'cancelled')
}
