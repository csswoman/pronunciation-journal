import { calculateFsrsRetrievability } from "@/lib/srs/fsrs-schedule";
import type { Grade } from "../attempt-grade";
import type { LearningItem } from "../verification/types";
import type { RandomSource } from "./random";

export interface ScheduledReviewRecall {
  retrievability: number;
  recalled: boolean;
  /** Diagnostic only (Task 8.9g): the raw RNG draw compared against
   * retrievability. Never consumed by scheduling or C11 — exists so the
   * audit trace can prove `recalled === (rngSample < retrievability)`
   * without re-deriving randomness out of band. */
  rngSample: number;
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
  const rngSample = random.next();
  return {
    retrievability,
    recalled: rngSample < retrievability,
    rngSample,
  };
}
