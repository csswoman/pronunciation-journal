// ── Constants ─────────────────────────────────────────────────────────────────

/** Minimum answers in a calendar day to count it as an active practice day. */
export const DAILY_STREAK_THRESHOLD = 5

/**
 * IANA timezone used for "what day is it?" bucketing.
 * A day is 00:00-23:59 in this timezone.
 */
export const STREAK_TIMEZONE = 'America/Lima'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DailyStreakResult {
  /** Days practiced consecutively ending today (or yesterday if today not yet done). */
  currentStreak: number
  /** Longest consecutive run ever. */
  maxStreak: number
  /** Whether the user has already hit the threshold today. */
  completedToday: boolean
}

// ── Pure helpers ──────────────────────────────────────────────────────────────

/**
 * Convert a UTC ISO timestamp to a YYYY-MM-DD date string in the given
 * IANA timezone without depending on any third-party library.
 */
export function toLocalDateString(utcIso: string, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone, dateStyle: 'short' }).format(
    new Date(utcIso),
  )
}

/**
 * Given a list of UTC ISO timestamps (one per answer) and a reference "now"
 * timestamp, return the streak counts.
 */
export function computeStreakFromTimestamps(
  answeredAts: string[],
  nowIso: string,
  timeZone: string = STREAK_TIMEZONE,
  threshold: number = DAILY_STREAK_THRESHOLD,
): DailyStreakResult {
  const countsByDate = new Map<string, number>()
  for (const ts of answeredAts) {
    const day = toLocalDateString(ts, timeZone)
    countsByDate.set(day, (countsByDate.get(day) ?? 0) + 1)
  }

  const qualifyingDays = Array.from(countsByDate.entries())
    .filter(([, count]) => count >= threshold)
    .map(([day]) => day)
    .sort()

  const qualifyingSet = new Set(qualifyingDays)
  const todayStr = toLocalDateString(nowIso, timeZone)
  const completedToday = qualifyingSet.has(todayStr)

  let maxStreak = 0
  let run = 0
  for (let i = 0; i < qualifyingDays.length; i++) {
    if (i === 0) {
      run = 1
    } else {
      run = isConsecutive(qualifyingDays[i - 1], qualifyingDays[i]) ? run + 1 : 1
    }
    if (run > maxStreak) maxStreak = run
  }

  const anchor = completedToday ? todayStr : yesterdayStr(todayStr)
  let currentStreak = 0

  if (qualifyingSet.has(anchor)) {
    currentStreak = 1
    let prev = anchor
    while (true) {
      const before = yesterdayStr(prev)
      if (!qualifyingSet.has(before)) break
      currentStreak++
      prev = before
    }
  }

  return { currentStreak, maxStreak, completedToday }
}

/** Return the YYYY-MM-DD string for the day before `dateStr`. */
function yesterdayStr(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`)
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

/** True when `b` is exactly one calendar day after `a` (both YYYY-MM-DD). */
function isConsecutive(a: string, b: string): boolean {
  return yesterdayStr(b) === a
}
