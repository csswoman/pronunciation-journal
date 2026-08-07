import { calculateFsrsRetrievability } from "@/lib/srs/fsrs-schedule";
import type { Grade } from "../attempt-grade";
import type { LearningItem } from "../verification/types";
import type { RandomSource } from "./random";

export interface ScheduledReviewRecall {
  retrievability: number;
  recalled: boolean;
}

export interface SimulatedScheduledReview extends ScheduledReviewRecall {
  grade: Grade;
  eventType: "scheduled-review";
  affectsSchedule: true;
}

/**
 * Models recall only for an actual FSRS Review. Modality is deliberately not
 * an input: it can shape the subsequent grade and timing, never recall odds.
 */
export function simulateScheduledReviewOutcome(
  item: LearningItem,
  now: Date,
  random: RandomSource,
): ScheduledReviewRecall | null {
  if (
    item.schedule.kind !== "fsrs"
    || item.schedule.state !== "Review"
    || !item.lastReview
  ) {
    return null;
  }

  const lastReview = new Date(item.lastReview);
  if (Number.isNaN(lastReview.getTime())) return null;

  const retrievability = calculateFsrsRetrievability({
    stability: item.schedule.stability,
    lastReview,
    now,
  });
  return {
    retrievability,
    recalled: random.next() < retrievability,
  };
}
