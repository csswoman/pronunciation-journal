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

/**
 * @deprecated Superseded by `retentionCalibrationWithinExpected` as of Task
 * 8.9i (Decisión 2). This compared `observedRetention` against a fixed
 * product target (`0.9 ± 0.05`), which conflated two different concerns:
 * whether the recall pipeline is calibrated to the retrievability FSRS
 * actually computed (a simulation/pipeline property), and whether the
 * scheduler achieves ~0.90 retrievability at the moment of review (a
 * scheduling-quality property that depends on day-granularity rounding and
 * per-profile lapse rates — see 8.9g). Kept only because
 * `criteria-retention.test.ts` and `c11-accuracy-independence.test.ts` pin
 * its historical fixed-band behavior as regression coverage of the
 * pre-8.9i contract. Do NOT use for acceptance/adversarial — use
 * `retentionCalibrationWithinExpected` for the canonical C11 gate and
 * `meanRetrievabilityAtReview` for the separate scheduling-quality metric.
 */
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

function eligibleReviewEvents(
  attempts: AttemptLog[],
  events: SrsReviewEvent[],
): SrsReviewEvent[] {
  const attemptsById = new Map(attempts.map((attempt) => [attempt.id, attempt]));
  return events.filter((event) => {
    const attempt = attemptsById.get(event.attemptLogId);
    return attempt !== undefined && isScheduledReviewEligibleForC11(attempt, event);
  });
}

export interface RetentionCalibrationResult extends CriterionResult {
  sampleSize: number;
  expectedRetention: number | null;
  observedRetentionValue: number | null;
  zScore: number | null;
}

/**
 * Task 8.9i, Decisión 2 aprobada — z-test at |z|<=3 (~99.7% two-sided CI
 * under the normal approximation to a binomial proportion), not the more
 * common 95% (|z|<=1.96). With thousands of eligible reviews per acceptance
 * run, a 95% band would flag ordinary sampling noise as "miscalibrated" (a
 * real, well-calibrated pipeline can show |z| in the 2-3 range purely by
 * chance at this sample size — see the 8.9i decision note for the measured
 * example). 3 sigma keeps the false-failure rate low while still catching
 * real miscalibration, which produces |z| orders of magnitude larger (any
 * leak of `accuracyByModality`, or a broken RNG wire, moves `observed` by
 * tenths, not thousandths, of the standard error).
 */
export const DEFAULT_CALIBRATION_Z_CRITICAL = 3;

/**
 * Canonical C11 (Task 8.9i, Decisión 2): validates that `recalled` follows
 * the retrievability FSRS actually computed for the same eligible reviews —
 * calibration, not "is retrievability near 0.90". Scheduling quality (does
 * the scheduler achieve ~0.90 retrievability at all) is a *separate*
 * concern, measured by `meanRetrievabilityAtReview`, never folded back into
 * this pass/fail.
 *
 *   eligible = scheduled-review && affectsSchedule
 *   expectedRetention = mean(retrievabilityBeforeReview) over eligible
 *   observedRetention = correct / eligible.length
 *   z = (observedRetention - expectedRetention) / sqrt(expectedRetention*(1-expectedRetention)/n)
 *   passed = |z| <= zCriticalValue
 *
 * No per-profile thresholds, no `accuracyByModality`, no change to
 * `desiredRetention` — the target retention value never appears in this
 * function; it only compares two quantities derived from the same reviews.
 */
export function retentionCalibrationWithinExpected(
  attempts: AttemptLog[],
  events: SrsReviewEvent[],
  minimumReviews: number,
  zCriticalValue: number = DEFAULT_CALIBRATION_Z_CRITICAL,
): RetentionCalibrationResult {
  const eligible = eligibleReviewEvents(attempts, events);
  const n = eligible.length;
  const name = "retention-calibration-within-expected";

  if (n < minimumReviews) {
    return {
      passed: false,
      name,
      measured: n,
      limit: minimumReviews,
      detail: `insufficient-data: ${n}/${minimumReviews} scheduled reviews`,
      sampleSize: n,
      expectedRetention: null,
      observedRetentionValue: null,
      zScore: null,
    };
  }

  const retrievabilities = eligible
    .map((event) => event.fsrsAudit.retrievabilityBeforeReview)
    .filter((value): value is number => value !== undefined);
  if (retrievabilities.length < n) {
    return {
      passed: false,
      name,
      measured: retrievabilities.length,
      limit: n,
      detail: `${n - retrievabilities.length} eligible review(s) missing `
        + "fsrsAudit.retrievabilityBeforeReview",
      sampleSize: n,
      expectedRetention: null,
      observedRetentionValue: null,
      zScore: null,
    };
  }

  const attemptsById = new Map(attempts.map((attempt) => [attempt.id, attempt]));
  const expectedRetention = retrievabilities.reduce((total, value) => total + value, 0) / n;
  const correctCount = eligible.filter((event) => (
    attemptsById.get(event.attemptLogId)?.assessment.correct === true
  )).length;
  const observed = correctCount / n;

  const standardError = Math.sqrt((expectedRetention * (1 - expectedRetention)) / n);
  const zScore = standardError === 0
    ? (observed === expectedRetention ? 0 : Number.POSITIVE_INFINITY * Math.sign(observed - expectedRetention))
    : (observed - expectedRetention) / standardError;

  return {
    passed: Math.abs(zScore) <= zCriticalValue,
    name,
    measured: observed,
    limit: expectedRetention,
    detail: `observed=${observed.toFixed(4)} expected=${expectedRetention.toFixed(4)} `
      + `z=${zScore.toFixed(3)} (|z|<=${zCriticalValue}) n=${n}`,
    sampleSize: n,
    expectedRetention,
    observedRetentionValue: observed,
    zScore,
  };
}

export interface RetrievabilitySegmentResult {
  segment: "stable" | "low-stability-post-lapse";
  sampleSize: number;
  meanRetrievability: number | null;
}

/** Matches the population 8.9g identified as most exposed to day-rounding. */
export const LOW_STABILITY_SEGMENT_THRESHOLD_DAYS = 1;

/**
 * Task 8.9i, Decisión 2 — scheduling-quality metric, deliberately separate
 * from C11. Reveals when the scheduler cannot reach the 0.90 target due to
 * day-granularity rounding (`lib/srs/fsrs-schedule.ts`) or post-lapse state,
 * without being confused for a C11 (sampling/calibration) failure: a
 * segment can show `meanRetrievability` far from 0.90 while C11 still
 * passes, because C11 only asks whether `recalled` tracked whatever
 * retrievability actually was.
 */
export function meanRetrievabilityAtReview(
  attempts: AttemptLog[],
  events: SrsReviewEvent[],
  lowStabilityThresholdDays: number = LOW_STABILITY_SEGMENT_THRESHOLD_DAYS,
): RetrievabilitySegmentResult[] {
  const eligible = eligibleReviewEvents(attempts, events);
  const segments: Record<RetrievabilitySegmentResult["segment"], number[]> = {
    stable: [],
    "low-stability-post-lapse": [],
  };

  for (const event of eligible) {
    const retrievability = event.fsrsAudit.retrievabilityBeforeReview;
    if (retrievability === undefined) continue;
    const priorStability = event.priorSchedule.kind === "fsrs"
      ? event.priorSchedule.stability
      : undefined;
    const segment: RetrievabilitySegmentResult["segment"] = (
      priorStability !== undefined && priorStability < lowStabilityThresholdDays
    ) ? "low-stability-post-lapse" : "stable";
    segments[segment].push(retrievability);
  }

  return (["stable", "low-stability-post-lapse"] as const).map((segment) => {
    const values = segments[segment];
    return {
      segment,
      sampleSize: values.length,
      meanRetrievability: values.length === 0
        ? null
        : values.reduce((total, value) => total + value, 0) / values.length,
    };
  });
}
