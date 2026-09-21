import { db } from '@/lib/db'
import type { MissionSessionSummary } from '@/lib/practice/daily-plan/mission-avoidance'

/**
 * Loads the learner's most recent mission sessions (any mission id), newest
 * first, for avoidance detection in the daily-plan composer.
 *
 * Uses the existing missionSessions Dexie table, isolated from the pure
 * avoidance-detection logic in mission-avoidance.ts so that logic stays
 * unit-testable without IndexedDB.
 */
export async function loadRecentMissionSessions(
  userId: string,
  limit: number,
): Promise<MissionSessionSummary[]> {
  const rows = await db.missionSessions.where('userId').equals(userId).toArray()

  return rows
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
    .slice(0, limit)
    .map((row) => ({ status: row.status, startedAt: row.startedAt }))
}
