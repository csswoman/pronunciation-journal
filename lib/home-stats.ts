import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

function getServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase credentials");
  }
  return createClient<Database>(url, key);
}

export interface WeeklyProgress {
  lessonsThisWeek: number;
  weeklyChange: number;
  barData: number[];
}

export interface StreakData {
  currentStreak: number;
  activeDays: boolean[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: string | null;
  progress?: number;
  target?: number;
}

/**
 * Get weekly progress data from answer_history
 * Returns lessons completed this week and comparison to last week
 */
export async function getWeeklyProgress(userId: string): Promise<WeeklyProgress> {
  const supabase = getServerClient();

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(weekAgo.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Get this week's exercises (count unique days with at least one correct answer)
  const { data: thisWeek } = await supabase
    .from("answer_history")
    .select("answered_at, is_correct")
    .eq("user_id", userId)
    .gte("answered_at", weekAgo.toISOString())
    .lte("answered_at", now.toISOString());

  // Get last week's exercises
  const { data: lastWeek } = await supabase
    .from("answer_history")
    .select("answered_at, is_correct")
    .eq("user_id", userId)
    .gte("answered_at", twoWeeksAgo.toISOString())
    .lt("answered_at", weekAgo.toISOString());

  // Count lessons (days with activity) for this week
  const thisWeekDays = new Set<string>();
  thisWeek?.forEach((entry) => {
    if (entry.answered_at) {
      const date = new Date(entry.answered_at).toISOString().split("T")[0];
      if (entry.is_correct) thisWeekDays.add(date);
    }
  });

  const lastWeekDays = new Set<string>();
  lastWeek?.forEach((entry) => {
    if (entry.answered_at) {
      const date = new Date(entry.answered_at).toISOString().split("T")[0];
      if (entry.is_correct) lastWeekDays.add(date);
    }
  });

  const lessonsThisWeek = thisWeekDays.size;
  const lessonsLastWeek = lastWeekDays.size;
  const weeklyChange = lessonsThisWeek - lessonsLastWeek;

  // Build bar chart data (7 days, normalized to 0-1)
  const barData: number[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    const dayCount = thisWeek?.filter((entry) => {
      if (!entry.answered_at) return false;
      const entryDate = new Date(entry.answered_at).toISOString().split("T")[0];
      return entryDate === dateStr && entry.is_correct;
    }).length || 0;

    barData.push(Math.min(dayCount / 5, 1));
  }

  return { lessonsThisWeek, weeklyChange, barData };
}

/**
 * Get streak data from user_sound_progress
 * Returns current streak and active days for the past 7 days
 */
export async function getStreakData(userId: string): Promise<StreakData> {
  const supabase = getServerClient();

  // Get the user's best streak and last practice date
  const { data: progressData } = await supabase
    .from("user_sound_progress")
    .select("streak, best_streak, last_practiced")
    .eq("user_id", userId)
    .order("last_practiced", { ascending: false });

  const currentStreak = Math.max(...(progressData?.map((p) => p.streak || 0) || [0]));

  // Get activity for last 7 days
  const activeDays: boolean[] = [];
  const now = new Date();

  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    const hasActivity = progressData?.some((p) => {
      if (!p.last_practiced) return false;
      const practiceDate = new Date(p.last_practiced).toISOString().split("T")[0];
      return practiceDate === dateStr;
    });

    activeDays.push(!!hasActivity);
  }

  return { currentStreak, activeDays };
}

/**
 * Get achievements for the user
 * Includes easy achievements like: first lesson, 1-week streak, etc.
 */
export async function getAchievements(userId: string): Promise<Achievement[]> {
  const supabase = getServerClient();

  // Get user stats
  const { data: progressData } = await supabase
    .from("user_sound_progress")
    .select("streak, best_streak, last_practiced, status")
    .eq("user_id", userId);

  const { data: answerHistory } = await supabase
    .from("answer_history")
    .select("answered_at")
    .eq("user_id", userId);

  const { data: masteredSounds } = await supabase
    .from("user_sound_progress")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "mastered");

  const currentStreak = Math.max(...(progressData?.map((p) => p.streak || 0) || [0]));
  const bestStreak = Math.max(...(progressData?.map((p) => p.best_streak || 0) || [0]));
  const totalLessons = answerHistory?.length || 0;
  const masteredCount = masteredSounds?.length || 0;

  const achievements: Achievement[] = [];

  // First lesson
  if (totalLessons >= 1) {
    achievements.push({
      id: "first-lesson",
      name: "First Steps",
      description: "Complete your first lesson",
      icon: "🎓",
      unlockedAt: answerHistory?.[0]?.answered_at,
    });
  }

  // 7-day streak
  if (currentStreak >= 7) {
    achievements.push({
      id: "week-streak",
      name: "Week Warrior",
      description: "Maintain a 7-day streak",
      icon: "🔥",
      unlockedAt: new Date().toISOString(),
    });
  } else if (currentStreak > 0) {
    achievements.push({
      id: "week-streak",
      name: "Week Warrior",
      description: "Maintain a 7-day streak",
      icon: "🔥",
      progress: currentStreak,
      target: 7,
    });
  }

  // 10 lessons completed
  if (totalLessons >= 10) {
    achievements.push({
      id: "ten-lessons",
      name: "Getting Started",
      description: "Complete 10 lessons",
      icon: "📚",
      unlockedAt: new Date().toISOString(),
    });
  } else if (totalLessons > 0) {
    achievements.push({
      id: "ten-lessons",
      name: "Getting Started",
      description: "Complete 10 lessons",
      icon: "📚",
      progress: totalLessons,
      target: 10,
    });
  }

  // Master a sound
  if (masteredCount >= 1) {
    achievements.push({
      id: "sound-master",
      name: "Sound Master",
      description: "Master your first sound",
      icon: "🎯",
      unlockedAt: new Date().toISOString(),
    });
  }

  // 30-day streak
  if (bestStreak >= 30) {
    achievements.push({
      id: "month-streak",
      name: "Month Milestone",
      description: "Reach a 30-day streak",
      icon: "⭐",
      unlockedAt: new Date().toISOString(),
    });
  } else if (currentStreak > 0) {
    achievements.push({
      id: "month-streak",
      name: "Month Milestone",
      description: "Reach a 30-day streak",
      icon: "⭐",
      progress: currentStreak,
      target: 30,
    });
  }

  return achievements;
}
