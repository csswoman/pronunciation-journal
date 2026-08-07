import type {
  AttemptLog,
  SrsReviewEvent,
} from "../../verification/types";
import type { CriterionResult } from "./load";

export function observedRetentionWithinTarget(
  attempts: AttemptLog[],
  events: SrsReviewEvent[],
  target: number,
  tolerance: number,
  minimumReviews: number,
): CriterionResult {
  const attemptsById = new Map(attempts.map((attempt) => [attempt.id, attempt]));
  const scheduled = events.flatMap((event) => {
    const attempt = attemptsById.get(event.attemptLogId);
    return attempt?.eventType === "scheduled-review" ? [{ event, attempt }] : [];
  });
  if (scheduled.length < minimumReviews) {
    return {
      passed: false,
      name: "observed-retention-within-target",
      measured: scheduled.length,
      limit: minimumReviews,
      detail: `insufficient sample: ${scheduled.length}/${minimumReviews} scheduled reviews`,
    };
  }

  const correct = scheduled.filter(({ attempt }) => attempt.assessment.correct).length;
  const measured = correct / scheduled.length;
  const lower = target - tolerance;
  const upper = target + tolerance;
  return {
    passed: measured >= lower && measured <= upper,
    name: "observed-retention-within-target",
    measured,
    limit: target,
    detail: `${correct}/${scheduled.length}; accepted range ${lower.toFixed(3)}-${upper.toFixed(3)}`,
  };
}
