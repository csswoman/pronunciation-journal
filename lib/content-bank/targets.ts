import type { CEFRLevel } from "@/lib/exercises/cefr";
import { TOPIC_CATALOG } from "@/lib/topic-catalog";
import { resolveLearnerLevel } from "@/lib/learner-level/core";
import type { SupabaseClient } from "@supabase/supabase-js";

export const DEFAULT_BANK_LEVELS: CEFRLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

export interface LevelTopicTarget {
  level: CEFRLevel;
  topicId: string;
}

/**
 * Chooses up to `limit` (level, topic) combinations with the fewest
 * items currently in the content bank.
 */
export async function pickNextGenerationTargets(
  supabase: SupabaseClient,
  limit: number = 4,
): Promise<LevelTopicTarget[]> {
  const levels = DEFAULT_BANK_LEVELS;
  const topics = TOPIC_CATALOG.map((t) => t.id);
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const activeLevelCounts = new Map<CEFRLevel, number>();
  try {
    const { data: recentSessions } = await supabase
      .from("activity_sessions")
      .select("user_id")
      .not("user_id", "is", null)
      .not("completed_at", "is", null)
      .gte("completed_at", cutoff)
      .order("completed_at", { ascending: false })
      .limit(500);
    const activeUserIds = [...new Set((recentSessions ?? []).flatMap((row) => row.user_id ? [row.user_id] : []))];

    if (activeUserIds.length > 0) {
      const { data: profiles } = await supabase
        .from("user_profiles")
        .select("id, cefr_level, cefr_level_source, cefr_level_updated_at")
        .in("id", activeUserIds);

      for (const profile of profiles ?? []) {
        const resolution = resolveLearnerLevel({
          profileLevel: profile.cefr_level,
          profileSource: profile.cefr_level_source,
          profileUpdatedAt: profile.cefr_level_updated_at,
        });
        activeLevelCounts.set(resolution.level, (activeLevelCounts.get(resolution.level) ?? 0) + 1);
      }
    }
  } catch {
    // Active-level preference is optional; fall back to balancing all CEFR levels.
  }

  const { data } = await supabase
    .from("content_bank_items")
    .select("level, topic_id")
    .eq("kind", "coach_exercise");

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const key = `${row.level}:${row.topic_id}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const candidates: Array<{ level: CEFRLevel; topicId: string; count: number }> = [];
  for (const level of levels) {
    for (const topicId of topics) {
      const key = `${level}:${topicId}`;
      candidates.push({
        level,
        topicId,
        count: counts.get(key) ?? 0,
      });
    }
  }

  candidates.sort((a, b) =>
    (activeLevelCounts.get(b.level) ?? 0) - (activeLevelCounts.get(a.level) ?? 0)
      || a.count - b.count
      || a.level.localeCompare(b.level)
      || a.topicId.localeCompare(b.topicId),
  );

  return candidates.slice(0, limit).map(({ level, topicId }) => ({ level, topicId }));
}
