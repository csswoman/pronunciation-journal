import { createSupabaseServerClient } from '@/lib/supabase/server'
import { computeStreakFromTimestamps, type DailyStreakResult } from './streak-core'
export type { DailyStreakResult } from './streak-core'

/**
 * A day "counts" toward the streak if the user did ANY qualifying activity —
 * answered a word, completed a practice session, or finished a reading
 * lesson. Unlike the old answer-only streak, this is intentionally a
 * threshold-of-1 check (see computeStreakFromTimestamps's `threshold` param):
 * one qualifying event is enough, we don't require 5 of them once other
 * activity types are in the mix.
 */
const ANY_ACTIVITY_THRESHOLD = 1

// ── Supabase query ────────────────────────────────────────────────────────────

/**
 * Server-only: fetch timestamps from every activity source that should count
 * toward the daily streak, and compute the user's streak from the union.
 */
export async function getDailyStreak(userId: string): Promise<DailyStreakResult> {
  const supabase = await createSupabaseServerClient()

  const [answerHistory, activitySessions, lessonCompletions] = await Promise.all([
    supabase
      .from('answer_history')
      .select('answered_at')
      .eq('user_id', userId)
      .not('answered_at', 'is', null),
    supabase
      .from('activity_sessions')
      .select('completed_at')
      .eq('user_id', userId),
    supabase
      .from('lesson_completions')
      .select('completed_at')
      .eq('user_id', userId),
  ])

  if (answerHistory.error) throw answerHistory.error
  if (activitySessions.error) throw activitySessions.error
  if (lessonCompletions.error) throw lessonCompletions.error

  const timestamps = [
    ...(answerHistory.data ?? []).map((r) => r.answered_at as string),
    ...(activitySessions.data ?? []).map((r) => r.completed_at as string),
    ...(lessonCompletions.data ?? []).map((r) => r.completed_at as string),
  ].filter(Boolean)

  return computeStreakFromTimestamps(
    timestamps,
    new Date().toISOString(),
    undefined,
    ANY_ACTIVITY_THRESHOLD,
  )
}
