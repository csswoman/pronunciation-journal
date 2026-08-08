/** Multidimensional feasibility dump for Task 8.9e. */
import { DEFAULT_BASE_ACTIVATION_POLICY } from "../../lib/essential-words/base-activation-allowance";
import {
  C9_HORIZON_SESSIONS,
  deriveRequiredBaseActivations,
  describeMaxBaseSkillActivationsContract,
  evaluateBaseActivationWindows,
  evaluateMultidimensionalFeasibility,
  projectBaseServiceCapacityPerSession,
} from "../../lib/essential-words/simulation/base-throughput-feasibility";
import { buildAdmissionLoadEnvelope } from "../../lib/essential-words/simulation/admission-envelope";
import { isC8Applicable } from "../../lib/essential-words/simulation/criterion-applicability";
import {
  computeRequiredArrivalSecondsPerSession,
} from "../../lib/essential-words/simulation/throughput-rates";
import {
  baseSkillActivationLiveness,
  backlogStable,
  budgetRespected,
  newWordLiveness,
  noOverdueStarvation,
  noSynchronizedPeaks,
  observedRetentionWithinTarget,
  percentile95WithinBudget,
  recoveryExits,
  recoveryReturnSessions,
} from "../../lib/essential-words/simulation/criteria";
import { PROFILES } from "../../lib/essential-words/simulation/profiles";
import {
  runSimulation,
  SIMULATION_ACTIVATION_LIMITS,
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
  horizonSessions: C9_HORIZON_SESSIONS,
});
const safetyCeiling = SIMULATION_ACTIVATION_LIMITS.absoluteBaseActivationSafetyCeiling;
const contract = describeMaxBaseSkillActivationsContract();

process.stdout.write(`${JSON.stringify({
  maxBaseContract: contract,
  absoluteBaseActivationSafetyCeiling: safetyCeiling,
  policy: DEFAULT_BASE_ACTIVATION_POLICY,
})}\n`);

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil(p * sorted.length) - 1),
  );
  return sorted[index]!;
}

for (const profile of Object.values(PROFILES)) {
  const result = runSimulation(profile, options);
  const active = result.days.filter((day) => day.active);
  const c8Applicable = isC8Applicable(profile.id);
  const derived = deriveRequiredBaseActivations({
    configuredNewWordsTarget: 10,
    minimumC8Share: 0.6,
    horizonSessions: C9_HORIZON_SESSIONS,
  });
  const requiredArrival = computeRequiredArrivalSecondsPerSession({
    targetNewWordsPerSession: 10,
    minimumC8Share: 0.6,
    envelope,
    c8Applicable,
  });
  const avg = (pick: (day: (typeof active)[number]) => number) => (
    active.reduce((total, day) => total + pick(day), 0) / Math.max(1, active.length)
  );
  const allowanceSeries = active.map((day) => day.dynamicBaseAllowanceMax ?? day.baseSkillActivations);
  const limiting = active.reduce<Record<string, number>>((map, day) => {
    const key = day.dynamicBaseLimitingFactor ?? "unknown";
    map[key] = (map[key] ?? 0) + 1;
    return map;
  }, {});
  const mandatorySeconds = avg((day) => day.mandatorySelectedSeconds ?? 0);
  const projected = projectBaseServiceCapacityPerSession({
    availableSecondsPerSession: 900,
    committedMandatorySecondsPerSession: mandatorySeconds,
    listeningCost: SIMULATION_COSTS.listening,
    productionCost: SIMULATION_COSTS.production,
    absoluteSafetyCeiling: safetyCeiling,
  });
  const pendingBase = avg((day) => day.pendingBaseCount ?? 0);
  const placementDemand = avg((day) => (
    (day.placementListeningReservations ?? 0) + (day.placementProductionReservations ?? 0)
  ));
  const requiredSeries = active.map((day) => (
    day.baseSkillActivations
    + (day.pendingBaseCount ?? 0)
    + (day.placementListeningReservations ?? 0)
    + (day.placementProductionReservations ?? 0)
  ));
  const windows = evaluateBaseActivationWindows({
    requiredActivationsBySession: requiredSeries,
    serviceCapacityPerSession: projected,
    horizonSessions: C9_HORIZON_SESSIONS,
  });
  const multi = evaluateMultidimensionalFeasibility({
    configuredNewWordsTarget: c8Applicable ? 10 : 0,
    minimumC8Share: 0.6,
    horizonSessions: C9_HORIZON_SESSIONS,
    availableSecondsPerSession: 900,
    committedMandatorySecondsPerSession: mandatorySeconds,
    usageSecondsPerSession: avg((day) => day.usageSeconds ?? 0),
    projectedBaseServicePerSession: projected,
    requiredArrivalSecondsPerSession: requiredArrival,
    actualArrivalSecondsPerSession: avg((day) => day.actualArrivalRateSeconds ?? 0),
    placementBaseActivationsPerSession: placementDemand,
    existingPendingBaseActivationsPerSession: pendingBase,
  });
  const c8 = newWordLiveness(result.days, 10);
  const c9 = baseSkillActivationLiveness(result.eligibility, 8);
  const c11 = observedRetentionWithinTarget(
    result.attemptLogs,
    result.srsEvents,
    0.9,
    0.05,
    50,
  );
  const c1 = budgetRespected(result.days, 900);
  const c2 = percentile95WithinBudget(result.days, 900);
  const c3 = recoveryExits(result.days);
  const c4 = backlogStable(result.days, 14, 2, 900);
  const c5 = recoveryReturnSessions(result.days, 14);
  const c7 = noSynchronizedPeaks(result.days, 900);
  const c10 = noOverdueStarvation(result.deferredObservations, 12);

  process.stdout.write(`${JSON.stringify({
    profile: profile.id,
    c8Applicable,
    requiredBaseArrivalPerSession: c8Applicable ? derived.requiredBaseActivationsPerSession : null,
    dynamicAllowance: {
      p50: percentile(allowanceSeries, 0.5),
      p95: percentile(allowanceSeries, 0.95),
      max: Math.max(0, ...allowanceSeries),
    },
    limitingFactorDistribution: limiting,
    projectedBaseServicePerSession: projected,
    baseActivationsServedPerSession: avg((day) => day.baseSkillActivations),
    listeningServed: avg((day) => day.servedListening ?? 0),
    productionServed: avg((day) => day.servedProduction ?? 0),
    pendingP95: percentile(active.map((day) => day.pendingBaseCount ?? 0), 0.95),
    pendingMax: Math.max(0, ...active.map((day) => day.pendingBaseCount ?? 0)),
    c9WorstWait: c9.measured,
    capacitySafeNewWordsAvg: avg((day) => day.capacitySafeNewWords ?? 0),
    admittedNewWordsAvg: avg((day) => day.newWords),
    C1: c1.passed,
    C2: c2.passed,
    C3: c3.passed,
    C4: c4.passed,
    C5: c5.passed,
    C7: c7.passed,
    C8: c8,
    C9: { passed: c9.passed, measured: c9.measured },
    C10: c10.passed,
    C11: { passed: c11.passed, measured: c11.measured },
    recoveryShare: active.filter((day) => day.mode === "recovery").length / Math.max(1, active.length),
    mandatorySelectedSecondsAvg: mandatorySeconds,
    secondsStatus: multi.seconds.status,
    baseSlotStatus: multi.baseActivations.status,
    overallTargetStatus: c8Applicable ? multi.overallStatus : "not-applicable",
    bottlenecks: multi.bottlenecks,
    worstRollingWindowMargin: windows.worstMargin,
    requiredBaseOver8: multi.baseActivations.requiredOverHorizon,
    capacityOver8: multi.baseActivations.serviceCapacityOverHorizon,
  })}\n`);
}
