import type {
  AttemptLog,
  SrsReviewEvent,
} from "../../verification/types";
import type { CriterionResult } from "./load";

export type RetentionResult =
  | { status: "measured"; retention: number; sampleSize: number }
  | { status: "insufficient-data"; sampleSize: number; required: number };

/**
 * Canonical C11 eligibility (Task 8.5, reaudited 8.9g): an attempt counts
 * toward observed retention only if it is a genuine FSRS scheduled review
 * that affected the item's schedule. `verification`, `practice`,
 * `learning-step`, `placement` and introduction attempts are never eligible,
 * regardless of correctness — this is the single source of truth other
 * modules (diagnostics, tests) must reuse instead of re-deriving the filter.
 */
export function isScheduledReviewEligibleForC11(
  attempt: Pick<AttemptLog, "eventType">,
  event: Pick<SrsReviewEvent, "affectsSchedule">,
): boolean {
  return attempt.eventType === "scheduled-review" && event.affectsSchedule === true;
}

export function observedRetention(
  attempts: AttemptLog[],
  events: SrsReviewEvent[],
  minimumReviews: number,
): RetentionResult {
  const attemptsById = new Map(attempts.map((attempt) => [attempt.id, attempt]));
  const scheduledAttemptIds = new Set(events.flatMap((event) => {
    const attempt = attemptsById.get(event.attemptLogId);
    return attempt && isScheduledReviewEligibleForC11(attempt, event)
      ? [attempt.id]
      : [];
  }));
  const scheduled = attempts.filter((attempt) => scheduledAttemptIds.has(attempt.id));

  if (scheduled.length < minimumReviews) {
    return {
      status: "insufficient-data",
      sampleSize: scheduled.length,
      required: minimumReviews,
    };
  }

  const correct = scheduled.filter((attempt) => attempt.assessment.correct).length;
  return {
    status: "measured",
    retention: correct / scheduled.length,
    sampleSize: scheduled.length,
  };
}

export function observedRetentionWithinTarget(
  attempts: AttemptLog[],
  events: SrsReviewEvent[],
  target: number,
  tolerance: number,
  minimumReviews: number,
): CriterionResult {
  const result = observedRetention(attempts, events, minimumReviews);
  if (result.status === "insufficient-data") {
    return {
      passed: false,
      name: "observed-retention-within-target",
      measured: result.sampleSize,
      limit: minimumReviews,
      detail: `insufficient-data: ${result.sampleSize}/${result.required} scheduled reviews`,
    };
  }

  const lower = target - tolerance;
  const upper = target + tolerance;
  return {
    passed: result.retention >= lower && result.retention <= upper,
    name: "observed-retention-within-target",
    measured: result.retention,
    limit: target,
    detail: `${Math.round(result.retention * result.sampleSize)}/${result.sampleSize}; accepted range ${lower.toFixed(3)}-${upper.toFixed(3)}`,
  };
}
