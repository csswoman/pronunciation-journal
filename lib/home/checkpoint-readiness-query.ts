import { createSupabaseServerClient } from "@/lib/supabase/server";
import { computeCheckpointReadiness, lastCompletedCheckpointAt, type CheckpointReadiness } from "@/lib/home/checkpoint-readiness";
import type { CefrLevelId } from "@/lib/courses/types";
import { buildTopicStatusByDeck } from "@/lib/progress/topic-progress";
import type { TopicProgressRow } from "@/lib/progress/domain-queries";
import { deckSlugForTopic } from "@/lib/practice/topic-decks";

function isMissingTable(error: { code?: string } | null): boolean {
  return error?.code === "PGRST205" || error?.code === "42P01";
}

/**
 * Determines whether the learner is ready for their level's checkpoint
 * assessment: all required lessons completed, at least half backed by SRS
 * evidence, and no checkpoint attempt in the last 3 days.
 *
 * `level` is the resolved learner level already lowercased — see
 * `getUserProfileLevel` (lib/home/queries.ts) and the level-mapping note in
 * plans/010-checkpoint-readiness-and-promotion.md.
 */
export async function getCheckpointReadiness(
  userId: string,
  level: CefrLevelId,
): Promise<CheckpointReadiness> {
  const supabase = await createSupabaseServerClient();

  const [lessonsResult, topicsResult, checkpointResult] = await Promise.all([
    supabase
      .from("lesson_completions")
      .select("lesson_slug")
      .eq("user_id", userId),
    supabase
      .from("topic_srs")
      .select("topic, srs_status, next_review_at, last_reviewed_at, interval_days, repetitions, ease_factor")
      .eq("user_id", userId),
    supabase
      .from("assessment_results")
      .select("completed_at, topic_scores")
      .eq("user_id", userId)
      .eq("mode", "checkpoint")
      .order("completed_at", { ascending: false })
      .limit(50),
  ]);

  if (lessonsResult.error) throw lessonsResult.error;
  if (topicsResult.error) throw topicsResult.error;
  if (checkpointResult.error && !isMissingTable(checkpointResult.error)) {
    throw checkpointResult.error;
  }

  const completedLessonSlugs = new Set(
    (lessonsResult.data ?? []).map((row) => row.lesson_slug as string),
  );

  const topics: TopicProgressRow[] = (topicsResult.data ?? []).map((row) => ({
    topic: row.topic,
    srsStatus: row.srs_status as TopicProgressRow["srsStatus"],
    nextReviewAt: row.next_review_at,
    lastReviewedAt: row.last_reviewed_at,
    intervalDays: row.interval_days ?? undefined,
    repetitions: row.repetitions ?? undefined,
    easeFactor: row.ease_factor ?? undefined,
  }));

  const statusByDeck = buildTopicStatusByDeck(topics);
  const topicsByDeck = new Map<string, TopicProgressRow[]>();
  for (const topic of topics) {
    const deckSlug = deckSlugForTopic(topic.topic);
    if (!deckSlug) continue;
    const rows = topicsByDeck.get(deckSlug) ?? [];
    rows.push(topic);
    topicsByDeck.set(deckSlug, rows);
  }

  const evidencedDeckSlugs = new Set<string>();
  for (const [deckSlug, status] of statusByDeck) {
    if (status !== "mastered" && status !== "review") continue;
    const rows = topicsByDeck.get(deckSlug) ?? [];
    const hasEnoughRepetitions = rows.some((row) => (row.repetitions ?? 0) >= 2);
    if (hasEnoughRepetitions) evidencedDeckSlugs.add(deckSlug);
  }

  const lastCheckpointAt = !checkpointResult.error
    ? lastCompletedCheckpointAt(checkpointResult.data ?? [])
    : null;

  return computeCheckpointReadiness({
    level,
    completedLessonSlugs,
    evidencedDeckSlugs,
    lastCheckpointAt,
  });
}
