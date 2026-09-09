import type { SRSRatingEventRecord } from "@/lib/db";
import type { UserLearningState } from "./learning-state";
import { topicDisplayLabel, VOCABULARY_TOPIC } from "@/lib/practice/topic-labels";

/**
 * Bridges `topic_srs` grades into the coach's `grammar.weakTopics`.
 *
 * Without this the two halves of the app disagree: practice writes every
 * graded answer to `topic_srs`, while the coach only ever saw the exercises
 * run inside its own chat. A learner could fail "present perfect" twenty times
 * in practice and the coach would keep offering it as something new.
 *
 * Reads the local `srsRatingEvents` mirror rather than Supabase so this keeps
 * working offline, which the rest of the practice flow already relies on.
 */

/** SM-2 grades below this count as a failure (1 = "Again"). */
const FAILING_GRADE = 2;

/** Ratings older than this stop describing the learner's current state. */
const WINDOW_DAYS = 30;

/** Below this many ratings a topic's error rate is noise, not signal. */
const MIN_SAMPLES = 3;

/**
 * A topic needs at least this error rate to be worth the coach's attention.
 * Matches `REVIEW_ERROR_THRESHOLD` in the starters registry, which is what
 * ultimately decides whether the "repasa lo que fallaste" card appears.
 */
const WEAK_ERROR_RATE = 0.4;

export type WeakTopic = UserLearningState["grammar"]["weakTopics"][number];

/**
 * Aggregates raw topic ratings into weak-topic rows.
 *
 * Pure: the caller supplies the events, so this is testable without Dexie and
 * reusable if the events ever come from the server instead.
 *
 * `vocab:vocabulary` is skipped — it is the catch-all bucket every saved word
 * lands in, so its error rate describes no particular concept the coach could
 * teach. See `topic-labels.ts`, which drops it for the same reason.
 */
export function aggregateTopicRatings(
  events: readonly SRSRatingEventRecord[],
  now: number = Date.now(),
): WeakTopic[] {
  const cutoff = now - WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const byTopic = new Map<string, { total: number; failed: number; lastAt: number }>();

  for (const event of events) {
    if (event.entityType !== "topic_srs") continue;
    const topic = event.topic;
    if (!topic || topic === VOCABULARY_TOPIC) continue;

    const at = new Date(event.occurredAt).getTime();
    if (!Number.isFinite(at) || at < cutoff) continue;

    const entry = byTopic.get(topic) ?? { total: 0, failed: 0, lastAt: 0 };
    entry.total += 1;
    if (event.grade <= FAILING_GRADE) entry.failed += 1;
    entry.lastAt = Math.max(entry.lastAt, at);
    byTopic.set(topic, entry);
  }

  const weak: WeakTopic[] = [];
  for (const [topic, { total, failed, lastAt }] of byTopic) {
    if (total < MIN_SAMPLES) continue;
    const errorRate = failed / total;
    if (errorRate < WEAK_ERROR_RATE) continue;
    weak.push({
      // The display label, not the `grammar:` key: these strings are read back
      // by the model and matched loosely against lesson titles.
      topic: topicDisplayLabel(topic) ?? topic,
      errorRate,
      sampleCount: total,
      lastCoveredAt: new Date(lastAt).toISOString(),
    });
  }

  return weak.sort((a, b) => b.errorRate - a.errorRate);
}

/**
 * Folds SRS-derived weak topics into the ones the coach already tracks.
 *
 * Coach-derived rows win on conflict: they come from exercises the coach ran
 * itself and already carry an EMA the coach has been updating. SRS rows only
 * fill in topics the coach has never seen, which is exactly the blind spot
 * this bridge exists to close.
 */
export function mergeWeakTopics(
  existing: readonly WeakTopic[],
  fromSrs: readonly WeakTopic[],
): WeakTopic[] {
  const known = new Set(existing.map((t) => t.topic.toLowerCase()));
  const additions = fromSrs.filter((t) => !known.has(t.topic.toLowerCase()));
  return [...existing, ...additions];
}
