/** Feasibility + arrival/service dump for Task 8.9c. */
import { buildAdmissionLoadEnvelope } from "../../lib/essential-words/simulation/admission-envelope";
import { isC8Applicable } from "../../lib/essential-words/simulation/criterion-applicability";
import {
  evaluateThroughputFeasibility,
} from "../../lib/essential-words/simulation/throughput-feasibility";
import {
  computeRequiredArrivalSecondsPerSession,
  envelopeSecondsPerNewWord,
} from "../../lib/essential-words/simulation/throughput-rates";
import { PROFILES } from "../../lib/essential-words/simulation/profiles";
import {
  runSimulation,
  SIMULATION_COSTS,
  SIMULATION_NEW_WORD_INTRODUCTION_SECONDS,
} from "../../lib/essential-words/simulation/run-simulation";
import type { SimulationOptions } from "../../lib/essential-words/simulation/state";

const options: SimulationOptions = {
  days: 180,
  corpusSize: 1_000,
  seed: 42,
  startAt: "2026-08-01T00:00:00.000Z",
  dailyBudgetSeconds: 900,
  targetNewWords: 10,
};

const envelope = buildAdmissionLoadEnvelope({
  costs: SIMULATION_COSTS,
  introductionSeconds: SIMULATION_NEW_WORD_INTRODUCTION_SECONDS,
  horizonSessions: 8,
});
const perWord = envelopeSecondsPerNewWord(envelope);

for (const profile of Object.values(PROFILES)) {
  const result = runSimulation(profile, options);
  const active = result.days.filter((day) => day.active);
  const c8Applicable = isC8Applicable(profile.id);
  const requiredArrival = computeRequiredArrivalSecondsPerSession({
    targetNewWordsPerSession: 10,
    minimumC8Share: 0.6,
    envelope,
    c8Applicable,
  });

  const avg = (pick: (day: (typeof active)[number]) => number) => (
    active.reduce((total, day) => total + pick(day), 0) / Math.max(1, active.length)
  );

  const avgMandatory = avg((day) => day.committedMandatorySeconds ?? day.futureMandatoryReservedSeconds);
  const avgBase = avg((day) => day.committedBaseSeconds ?? 0);
  const avgPlacement = avg((day) => day.committedPlacementSeconds ?? day.placementReservedSeconds);
  const avgUsage = avg((day) => day.usageSeconds ?? day.usageActivations * SIMULATION_COSTS.production);
  const avgActualArrival = avg((day) => day.actualArrivalRateSeconds ?? day.admissionDemandSeconds);
  const avgService = avg((day) => day.serviceRateSeconds ?? day.completedSeconds);
  const avgMargin = avg((day) => day.targetMarginSeconds ?? 0);
  const avgSafe = avg((day) => day.capacitySafeNewWords ?? 0);
  const avgOldestWait = avg((day) => day.oldestPendingWait ?? 0);
  const avgPending = avg((day) => day.pendingBaseCount ?? 0);
  const placementDemandSessions = active.filter((day) => (
    day.placementCandidates > 0 || day.placementReservedSeconds > 0 || day.placementConversions > 0
  )).length;

  const targetInfeasibleShare = c8Applicable
    ? active.filter((day) => day.targetFeasibilityStatus === "infeasible").length
      / Math.max(1, active.length)
    : null;

  const structural = evaluateThroughputFeasibility({
    horizonSessions: 8,
    availableSecondsPerSession: 900,
    committedMandatorySecondsPerSession: avgMandatory / 8,
    committedBaseSecondsPerSession: avgBase / 8,
    committedPlacementSecondsPerSession: avgPlacement / 8,
    usageSecondsPerSession: avgUsage,
    actualArrivalSecondsPerSession: avgActualArrival,
    requiredArrivalSecondsPerSession: requiredArrival,
  });

  const zeroPlacementReason = profile.placementConfidence !== "high"
    ? "profile-placementConfidence-not-high"
    : placementDemandSessions === 0
      ? "unexpected-zero-with-high-confidence"
      : null;

  process.stdout.write(`${JSON.stringify({
    profile: profile.id,
    criterionApplicable: { C8: c8Applicable },
    requiredArrivalSecondsPerSession: requiredArrival,
    actualArrivalSecondsPerSession: avgActualArrival,
    sustainableServiceSecondsPerSession: structural.sustainableServiceSecondsPerSession,
    serviceSecondsPerSession: avgService,
    committed: {
      mandatoryHorizonSeconds: avgMandatory,
      mandatoryPerSession: avgMandatory / 8,
      pendingBaseSeconds: avgBase,
      committedPlacementSeconds: avgPlacement,
      usageSeconds: avgUsage,
      requiredNewWordWork: requiredArrival,
      expectedFsrsDebtPerWord: perWord - envelope.immediateSeconds - envelope.baseActivationSeconds,
    },
    placement: {
      demandSessions: placementDemandSessions,
      zeroReason: zeroPlacementReason,
    },
    pendingBase: {
      avgCount: avgPending,
      avgOldestWait: avgOldestWait,
    },
    capacitySafeNewWordsAvg: avgSafe,
    topBaseBlockingReason: (() => {
      const counts = new Map<string, number>();
      for (const day of active) {
        if (!day.topBaseBlockingReason) continue;
        counts.set(
          day.topBaseBlockingReason,
          (counts.get(day.topBaseBlockingReason) ?? 0) + 1,
        );
      }
      return [...counts.entries()]
        .sort((left, right) => right[1] - left[1])[0]?.[0] ?? null;
    })(),
    targetMarginSeconds: avgMargin,
    targetFeasibility: c8Applicable ? structural.targetStatus : "not-applicable",
    actualFeasibility: structural.actualStatus,
    targetInfeasibleDayShare: targetInfeasibleShare,
    bottlenecks: structural.bottlenecks,
  })}\n`);
}
