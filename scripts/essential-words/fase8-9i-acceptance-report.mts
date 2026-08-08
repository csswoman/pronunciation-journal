/**
 * Task 8.9i — reporte final tras aprobar Decisión 1 (C8 capacity-conditioned)
 * y Decisión 2 (C11 = calibración observed vs expected, separada de
 * meanRetrievabilityAtReview). Misma configuración que acceptance.test.ts
 * (budget 900s, target 10, corpus 1000, 180 días, seed 42).
 */
import {
  backlogStable,
  baseSkillActivationLiveness,
  budgetRespected,
  meanRetrievabilityAtReview,
  newWordLiveness,
  noOverdueStarvation,
  noSynchronizedPeaks,
  percentile95WithinBudget,
  recoveryExits,
  recoveryReturnSessions,
  retentionCalibrationWithinExpected,
  usageActivationShare,
} from "../../lib/essential-words/simulation/criteria";
import { isC8Applicable, isC9Applicable } from "../../lib/essential-words/simulation/criterion-applicability";
import { PROFILES, type SimulationProfileId } from "../../lib/essential-words/simulation/profiles";
import { runSimulation } from "../../lib/essential-words/simulation/run-simulation";
import type { SimulationOptions } from "../../lib/essential-words/simulation/state";

const options: SimulationOptions = {
  days: 180,
  corpusSize: 1_000,
  seed: 42,
  startAt: "2026-08-01T00:00:00.000Z",
  dailyBudgetSeconds: 900,
  targetNewWords: 10,
};

const PROFILE_IDS: SimulationProfileId[] = ["steady", "intermittent", "bursty", "beginner", "advanced"];

for (const profileId of PROFILE_IDS) {
  const result = runSimulation(PROFILES[profileId], options);
  const { days } = result;

  const c1 = budgetRespected(days, 900);
  const c2 = percentile95WithinBudget(days, 900);
  const c3 = recoveryExits(days);
  const c6 = usageActivationShare(days, 7, 10, 0.3);
  const c7 = noSynchronizedPeaks(days, 900);
  const c8 = isC8Applicable(profileId) ? newWordLiveness(days, 10) : null;
  const c9 = isC9Applicable(profileId) ? baseSkillActivationLiveness(result.eligibility, 8) : null;
  const c10 = noOverdueStarvation(result.deferredObservations, 12);
  const c11 = retentionCalibrationWithinExpected(result.attemptLogs, result.srsEvents, 50);
  const retrievabilitySegments = meanRetrievabilityAtReview(result.attemptLogs, result.srsEvents);

  process.stdout.write(`${JSON.stringify({
    profileId,
    c1: c1.passed,
    c2: c2.passed,
    c3: c3.passed,
    c6: c6.passed,
    c7: c7.passed,
    c8: c8 === null ? "n/a" : c8.passed,
    c8Detail: c8 === null ? null : {
      highCapacitySessions: c8.highCapacitySessions,
      lowCapacitySessions: c8.lowCapacitySessions,
      zeroCapacitySessions: c8.zeroCapacitySessions,
      longestStarvationRunSessions: c8.longestStarvationRunSessions,
      measured: c8.measured,
    },
    c9: c9 === null ? "n/a" : c9.passed,
    c9Measured: c9 === null ? null : c9.measured,
    c10: c10.passed,
    c11: c11.passed,
    c11Detail: {
      sampleSize: c11.sampleSize,
      observedRetention: c11.observedRetentionValue,
      expectedRetention: c11.expectedRetention,
      zScore: c11.zScore,
    },
    retrievabilitySegments,
  })}\n`);
}

process.stdout.write("\n=== criterios específicos (no por perfil) ===\n");
const steady = runSimulation(PROFILES.steady, options);
const bursty = runSimulation(PROFILES.bursty, options);
process.stdout.write(`${JSON.stringify({
  c4Steady: backlogStable(steady.days, 14, 2, 900).passed,
  c5Bursty: recoveryReturnSessions(bursty.days, 14).passed,
})}\n`);
