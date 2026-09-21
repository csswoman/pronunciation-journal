import {
  STREAK_TIMEZONE,
  computeStreakFromTimestamps,
  toLocalDateString,
} from '@/lib/daily/streak-core'

export interface ImmersionActivityRow {
  completedAt: string
  durationMs: number | null
}

/** Learner-owned external immersion derived from persisted activity sessions. */
export interface ImmersionActivitySummary {
  currentStreak: number
  weekMinutes: number
}

function startOfLocalWeek(iso: string): string {
  const day = toLocalDateString(iso, STREAK_TIMEZONE)
  const [year, month, date] = day.split('-').map(Number)
  const localNoon = new Date(Date.UTC(year, month - 1, date, 12))
  const daysFromMonday = (localNoon.getUTCDay() + 6) % 7
  localNoon.setUTCDate(localNoon.getUTCDate() - daysFromMonday)
  return localNoon.toISOString().slice(0, 10)
}

/** Shared projection used by Home and the expanded Daily surface. */
export function summarizeImmersionActivity(
  rows: ImmersionActivityRow[],
  nowIso: string,
): ImmersionActivitySummary {
  const weekStart = startOfLocalWeek(nowIso)
  const weekMinutes = Math.round(rows.reduce((total, row) => {
    const localDay = toLocalDateString(row.completedAt, STREAK_TIMEZONE)
    return localDay >= weekStart ? total + (row.durationMs ?? 0) : total
  }, 0) / 60_000)

  return {
    currentStreak: computeStreakFromTimestamps(
      rows.map((row) => row.completedAt),
      nowIso,
      undefined,
      1,
    ).currentStreak,
    weekMinutes,
  }
}
