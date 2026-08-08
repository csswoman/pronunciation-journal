/**
 * Task 8.9h, Parte B — sandbox report generator.
 *
 * Compares policy A (current, day-granularity scheduler) against policy B
 * (experimental sub-day relearning for low-stability items) under
 * backlog-zero (budget effectively unconstrained), for the 5 profiles.
 *
 * Does NOT modify lib/srs/fsrs-schedule.ts. Policy B is applied only inside
 * this script's own `runSimulation` calls via a `mutateDay` hook
 * (see lib/essential-words/simulation/experiments/sub-day-relearning.ts).
 *
 * See docs/superpowers/plans/notes/2026-08-07-fase8-9h-c8-c9-spec-review.md
 * (Parte B) for the write-up this feeds.
 */
import { observedRetentionWithinTarget } from "../../lib/essential-words/simulation/criteria";
import {
  buildStabilityGrid,
  createEmptyTelemetry,
  createSubDayRelearningHooks,
} from "../../lib/essential-words/simulation/experiments/sub-day-relearning";
import { PROFILES, type SimulationProfileId } from "../../lib/essential-words/simulation/profiles";
import { runSimulation, type SimulationResult } from "../../lib/essential-words/simulation/run-simulation";
import type { SimulationOptions } from "../../lib/essential-words/simulation/state";

const options: SimulationOptions = {
  days: 180,
  corpusSize: 300,
  seed: 42,
  startAt: "2026-08-01T00:00:00.000Z",
  dailyBudgetSeconds: 200_000,
  targetNewWords: 10,
};

const PROFILE_IDS: SimulationProfileId[] = ["beginner", "intermittent", "bursty", "steady", "advanced"];

process.stdout.write("=== Grid: stability -> {interval, retrievability at due} ===\n");
const grid = buildStabilityGrid([0.1, 0.3, 0.5, 0.8, 1.0, 2.0]);
for (const row of grid) {
  process.stdout.write(`${JSON.stringify(row)}\n`);
}

function summarize(label: "A" | "B", result: SimulationResult) {
  const c11 = observedRetentionWithinTarget(result.attemptLogs, result.srsEvents, 0.9, 0.05, 50);
  const scheduledEvents = result.srsEvents.filter((event) => {
    const attempt = result.attemptLogs.find((a) => a.id === event.attemptLogId);
    return event.affectsSchedule && attempt?.eventType === "scheduled-review";
  });
  const retrievabilities = scheduledEvents
    .map((event) => event.fsrsAudit.retrievabilityBeforeReview)
    .filter((value): value is number => value !== undefined);
  const avgRetrievability = retrievabilities.reduce((t, v) => t + v, 0) / Math.max(1, retrievabilities.length);
  const learningStepAttempts = result.attemptLogs.filter((a) => a.eventType === "learning-step");
  const priorStabilities = scheduledEvents
    .filter((event) => event.priorSchedule.kind === "fsrs")
    .map((event) => (event.priorSchedule as { stability: number }).stability);
  const stabilityBuckets = {
    lt1: priorStabilities.filter((s) => s < 1).length,
    between1and5: priorStabilities.filter((s) => s >= 1 && s < 5).length,
    gte5: priorStabilities.filter((s) => s >= 5).length,
  };

  return {
    policy: label,
    c11Measured: c11.measured,
    c11Passed: c11.passed,
    avgRetrievabilityAtReview: avgRetrievability,
    scheduledReviewCount: scheduledEvents.length,
    learningRelearningAttempts: learningStepAttempts.length,
    stabilityBuckets,
  };
}

process.stdout.write("\n=== Backlog-zero, 5 perfiles: policy A (actual) vs policy B (sub-day) ===\n");
for (const profileId of PROFILE_IDS) {
  const baseline = runSimulation(PROFILES[profileId], options);
  const telemetry = createEmptyTelemetry();
  const hooks = createSubDayRelearningHooks(telemetry);
  const experimental = runSimulation(PROFILES[profileId], options, hooks);

  const a = summarize("A", baseline);
  const b = summarize("B", experimental);
  const extraLearningStepAttempts = b.learningRelearningAttempts - a.learningRelearningAttempts;
  const extraScheduledReviews = b.scheduledReviewCount - a.scheduledReviewCount;

  process.stdout.write(`${JSON.stringify({
    profileId,
    policyA: a,
    policyB: b,
    itemsRescheduled: telemetry.itemsRescheduled,
    totalDaysPulledForward: Number(telemetry.totalDaysPulledForward.toFixed(1)),
    extraLearningStepAttempts,
    extraScheduledReviews,
  })}\n`);
}
