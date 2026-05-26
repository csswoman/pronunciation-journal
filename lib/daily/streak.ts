import { createSupabaseServerClient } from '@/lib/supabase/server'

// ── Constants ─────────────────────────────────────────────────────────────────

/** Minimum answers in a calendar day to count it as an active practice day. */
export const DAILY_STREAK_THRESHOLD = 5

/**
 * IANA timezone used for "what day is it?" bucketing.
 * A day is 00:00–23:59 in this timezone.
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

// ── Pure helpers (exported for tests) ────────────────────────────────────────

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
 *
 * Rules:
 *   • A day qualifies when it has ≥ threshold answers (context='daily').
 *   • Days are bucketed in `timeZone` (00:00–23:59 local).
 *   • currentStreak: consecutive qualifying days ending on today OR yesterday
 *     (so the streak survives until midnight of the following day).
 *   • maxStreak: the longest consecutive run across all history.
 */
export function computeStreakFromTimestamps(
  answeredAts: string[],
  nowIso: string,
  timeZone: string = STREAK_TIMEZONE,
  threshold: number = DAILY_STREAK_THRESHOLD,
): DailyStreakResult {
  // 1. Count answers per local date.
  const countsByDate = new Map<string, number>()
  for (const ts of answeredAts) {
    const day = toLocalDateString(ts, timeZone)
    countsByDate.set(day, (countsByDate.get(day) ?? 0) + 1)
  }

  // 2. Collect qualifying days as a sorted set of YYYY-MM-DD strings.
  const qualifyingDays = Array.from(countsByDate.entries())
    .filter(([, count]) => count >= threshold)
    .map(([day]) => day)
    .sort()

  const qualifyingSet = new Set(qualifyingDays)

  const todayStr = toLocalDateString(nowIso, timeZone)
  const completedToday = qualifyingSet.has(todayStr)

  // 3. Compute maxStreak over the full history.
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

  // 4. Compute currentStreak backwards from today (or yesterday as grace).
  // "Anchor" is today if completed, otherwise yesterday — so a streak built
  // up through yesterday stays alive until tonight.
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

// ── Date arithmetic (no external deps) ───────────────────────────────────────

/** Return the YYYY-MM-DD string for the day before `dateStr`. */
function yesterdayStr(dateStr: string): string {
  // Parse as local noon to avoid DST edge cases on date boundaries
  const d = new Date(`${dateStr}T12:00:00`)
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

/** True when `b` is exactly one calendar day after `a` (both YYYY-MM-DD). */
function isConsecutive(a: string, b: string): boolean {
  return yesterdayStr(b) === a
}

// ── Supabase query ────────────────────────────────────────────────────────────

/**
 * Server-only: fetch `answered_at` timestamps for context='daily' answers
 * and compute the user's daily streak.
 */
export async function getDailyStreak(userId: string): Promise<DailyStreakResult> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('answer_history')
    .select('answered_at')
    .eq('user_id', userId)
    .eq('context', 'daily')
    .not('answered_at', 'is', null)

  if (error) throw error

  const timestamps = (data ?? [])
    .map((r) => r.answered_at as string)
    .filter(Boolean)

  return computeStreakFromTimestamps(timestamps, new Date().toISOString())
}
