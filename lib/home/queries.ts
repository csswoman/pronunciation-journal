import { createSupabaseServerClient } from "@/lib/supabase/server";
import { STREAK_TIMEZONE, toLocalDateString } from "@/lib/daily/streak";
import {
  DEFAULT_DAILY_GOAL_MINUTES,
  type DailyGoalProgress,
  type WeakestPhonemeHome,
} from "@/lib/home/constants";

export { DEFAULT_DAILY_GOAL_MINUTES, type DailyGoalProgress, type WeakestPhonemeHome };

/** Fallback per answer when `time_ms` is missing (~90 s). */
const FALLBACK_ANSWER_MS = 90_000;

/**
 * Sums `time_ms` from answer_history for the current calendar day (America/Lima).
 */
export async function getTodayPracticeGoal(userId: string): Promise<DailyGoalProgress> {
  const supabase = await createSupabaseServerClient();
  const nowIso = new Date().toISOString();
  const todayStr = toLocalDateString(nowIso, STREAK_TIMEZONE);

  const since = new Date();
  since.setDate(since.getDate() - 1);

  const { data, error } = await supabase
    .from("answer_history")
    .select("answered_at, time_ms")
    .eq("user_id", userId)
    .gte("answered_at", since.toISOString())
    .not("answered_at", "is", null);

  if (error) throw error;

  let totalMs = 0;
  for (const row of data ?? []) {
    const answeredAt = row.answered_at as string;
    if (toLocalDateString(answeredAt, STREAK_TIMEZONE) !== todayStr) continue;
    totalMs += row.time_ms ?? FALLBACK_ANSWER_MS;
  }

  const minutesDone = Math.round(totalMs / 60_000);
  const goalMinutes = DEFAULT_DAILY_GOAL_MINUTES;
  const percent =
    goalMinutes > 0 ? Math.min(100, Math.round((minutesDone / goalMinutes) * 100)) : 0;

  return { minutesDone, goalMinutes, percent };
}

/** Lowest-accuracy phoneme with at least 5 attempts, or null if none yet. */
export async function getWeakestPhonemeForHome(
  userId: string,
): Promise<WeakestPhonemeHome | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("user_sound_progress")
    .select("total_attempts, correct_answers, sounds(ipa, type, category)")
    .eq("user_id", userId)
    .gt("total_attempts", 0)
    .neq("status", "locked");

  if (error) throw error;

  const ranked = (data ?? [])
    .filter((r) => (r.total_attempts ?? 0) >= 5)
    .map((r) => {
      const attempts = r.total_attempts ?? 0;
      const correct = r.correct_answers ?? 0;
      const sound = r.sounds as { ipa: string; type: string | null; category: string | null } | null;
      return {
        ipa: sound?.ipa ?? "?",
        accuracy: attempts > 0 ? Math.round((correct / attempts) * 100) : 0,
        totalAttempts: attempts,
        label: sound?.type ?? sound?.category ?? null,
      };
    })
    .sort((a, b) => a.accuracy - b.accuracy);

  return ranked[0] ?? null;
}
