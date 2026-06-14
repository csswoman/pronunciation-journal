import { createSupabaseServerClient } from '@/lib/supabase/server'
import { computeStreakFromTimestamps, type DailyStreakResult } from './streak-core'
export type { DailyStreakResult } from './streak-core'

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
