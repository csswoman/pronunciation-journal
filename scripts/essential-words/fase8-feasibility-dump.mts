/** Feasibility + arrival/service dump for Task 8.9b. */
import { buildAdmissionLoadEnvelope } from "../../lib/essential-words/admission-envelope";
import {
  evaluateThroughputFeasibility,
  steadyC8C9Requirements,
} from "../../lib/essential-words/throughput-feasibility";
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
const req = steadyC8C9Requirements({
  targetNewWordsPerSession: 10,
  minimumAcceptedShare: 0.6,
  horizonSessions: 8,
  perNewWordSeconds: envelope.immediateSeconds + envelope.baseActivationSeconds,
  reviewEnvelopeSecondsPerWord: envelope.expectedReviewSecondsBySession
    .reduce((total, value) => total + value, 0),
});

for (const profile of Object.values(PROFILES)) {
  const result = runSimulation(profile, options);
  const active = result.days.filter((day) => day.active);
  const infeasibleDays = active.filter((day) => day.feasibilityStatus === "infeasible").length;
  const avgMandatory = active.reduce((t, d) => t + d.futureMandatoryReservedSeconds, 0)
    / Math.max(1, active.length);
  const avgArrival = active.reduce((t, d) => t + (d.arrivalRateSeconds ?? 0), 0)
    / Math.max(1, active.length);
  const avgService = active.reduce((t, d) => t + (d.serviceRateSeconds ?? d.completedSeconds), 0)
    / Math.max(1, active.length);

  const structural = evaluateThroughputFeasibility({
    horizonSessions: 8,
    availableSecondsPerSession: 900,
    committedMandatoryPerSession: avgMandatory / 8,
    committedBasePerSession: 0,
    committedPlacementPerSession: 0,
    usagePerSession: 25,
    requiredNewWordsPerSession: req.requiredNewWordsPerSession,
    secondsPerNewWordImmediate: envelope.immediateSeconds,
    secondsPerNewWordBase: envelope.baseActivationSeconds,
    expectedFsrsPerNewWordPerSession: envelope.expectedReviewSecondsBySession,
  });

  process.stdout.write(`${JSON.stringify({
    profile: profile.id,
    requiredNewWordsPerSession: req.requiredNewWordsPerSession,
    infeasibleDayShare: infeasibleDays / Math.max(1, active.length),
    avgFutureMandatorySeconds: avgMandatory,
    avgArrivalSeconds: avgArrival,
    avgServiceSeconds: avgService,
    avgArrivalMinusService: avgArrival - avgService,
    structuralFeasibility: structural.status,
    bottlenecks: structural.bottlenecks,
    residualSeconds: structural.residualSeconds,
  })}\n`);
}
