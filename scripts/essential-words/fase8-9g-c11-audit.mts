/**
 * Task 8.9g — audit report generator.
 *
 * Runs each profile under a backlog-zero scenario (budget effectively
 * unconstrained, so no session-capacity deferral is possible) and reports,
 * per profile:
 *   - observed C11 (scheduled-review only, canonical eligibility);
 *   - average retrievability at the moment of each scheduled review;
 *   - execution accuracy measured independently (learning-step correct
 *     rate, which is where accuracyByModality legitimately governs
 *     execution quality — never C11);
 *   - grade distribution among scheduled-review attempts;
 *   - share of scheduled reviews whose *prior* FSRS stability was under one
 *     day (the population most exposed to FSRS's day-granularity interval
 *     rounding).
 *
 * See docs/superpowers/plans/notes/2026-08-07-fase8-9g-c11-independence.md
 * for the write-up this feeds.
 */
import { observedRetentionWithinTarget } from "../../lib/essential-words/simulation/criteria";
import { PROFILES, type SimulationProfileId } from "../../lib/essential-words/simulation/profiles";
import { runSimulation } from "../../lib/essential-words/simulation/run-simulation";
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

for (const profileId of PROFILE_IDS) {
  const result = runSimulation(PROFILES[profileId], options);
  const c11 = observedRetentionWithinTarget(result.attemptLogs, result.srsEvents, 0.9, 0.05, 50);

  const attemptById = new Map(result.attemptLogs.map((attempt) => [attempt.id, attempt]));
  const scheduledEvents = result.srsEvents.filter((event) => (
    event.affectsSchedule && attemptById.get(event.attemptLogId)?.eventType === "scheduled-review"
  ));
  const scheduledAttempts = [...new Set(scheduledEvents.map((e) => e.attemptLogId))]
    .map((id) => attemptById.get(id)!);

  const retrievabilities = scheduledEvents
    .map((event) => event.fsrsAudit.retrievabilityBeforeReview)
    .filter((value): value is number => value !== undefined);
  const avgRetrievability = retrievabilities.reduce((t, v) => t + v, 0) / Math.max(1, retrievabilities.length);

  const priorStabilities = scheduledEvents
    .filter((event) => event.priorSchedule.kind === "fsrs")
    .map((event) => (event.priorSchedule as { stability: number }).stability);
  const lowStabilityShare = priorStabilities.filter((s) => s < 1).length / Math.max(1, priorStabilities.length);

  const learningStepAttempts = result.attemptLogs.filter((a) => a.eventType === "learning-step");
  const learningStepAccuracy = learningStepAttempts.filter((a) => a.assessment.correct).length
    / Math.max(1, learningStepAttempts.length);

  const gradeDist: Record<string, number> = {};
  for (const attempt of scheduledAttempts) {
    gradeDist[attempt.assessment.grade] = (gradeDist[attempt.assessment.grade] ?? 0) + 1;
  }

  process.stdout.write(`${JSON.stringify({
    profileId,
    recognitionAccuracy: PROFILES[profileId].accuracyByModality.recognition,
    c11Measured: c11.measured,
    c11Passed: c11.passed,
    scheduledReviewCount: scheduledAttempts.length,
    avgRetrievabilityAtReview: Number(avgRetrievability.toFixed(4)),
    lowStabilitySharePriorToReview: Number(lowStabilityShare.toFixed(4)),
    learningStepExecutionAccuracy: Number(learningStepAccuracy.toFixed(4)),
    gradeDistribution: gradeDist,
  })}\n`);
}
