/** Multidimensional feasibility dump for Task 8.9d. */
import {
  C9_HORIZON_SESSIONS,
  deriveRequiredBaseActivations,
  describeMaxBaseSkillActivationsContract,
  evaluateBaseActivationWindows,
  evaluateMultidimensionalFeasibility,
} from "../../lib/essential-words/base-throughput-feasibility";
import { buildAdmissionLoadEnvelope } from "../../lib/essential-words/admission-envelope";
import { isC8Applicable } from "../../lib/essential-words/criterion-applicability";
import {
  computeRequiredArrivalSecondsPerSession,
} from "../../lib/essential-words/throughput-rates";
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
const maxBase = SIMULATION_ACTIVATION_LIMITS.maxBaseSkillActivationsPerSession;
const contract = describeMaxBaseSkillActivationsContract();

process.stdout.write(`${JSON.stringify({
  maxBaseContract: contract,
  maxBaseSkillActivationsPerSession: maxBase,
})}\n`);

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

  const baseServed = avg((day) => day.baseSkillActivations);
  const listeningServed = avg((day) => day.servedListening ?? 0);
  const productionServed = avg((day) => day.servedProduction ?? 0);
  const pendingBase = avg((day) => day.pendingBaseCount ?? 0);
  const placementDemand = avg((day) => (
    (day.placementListeningReservations ?? 0) + (day.placementProductionReservations ?? 0)
  ));
  const mandatorySeconds = avg((day) => (
    day.committedMandatorySeconds ?? day.futureMandatoryReservedSeconds
  ));
  const requiredSeries = active.map((day) => (
    day.baseSkillActivations
    + (day.pendingBaseCount ?? 0)
    + (day.placementListeningReservations ?? 0)
    + (day.placementProductionReservations ?? 0)
  ));
  const windows = evaluateBaseActivationWindows({
    requiredActivationsBySession: requiredSeries,
    serviceCapacityPerSession: maxBase,
    horizonSessions: C9_HORIZON_SESSIONS,
  });

  const multi = evaluateMultidimensionalFeasibility({
    configuredNewWordsTarget: c8Applicable ? 10 : 0,
    minimumC8Share: 0.6,
    horizonSessions: C9_HORIZON_SESSIONS,
    availableSecondsPerSession: 900,
    committedMandatorySecondsPerSession: mandatorySeconds / 8,
    committedBaseSecondsPerSession: avg((day) => day.committedBaseSeconds ?? 0) / 8,
    committedPlacementSecondsPerSession: avg((day) => day.committedPlacementSeconds ?? 0) / 8,
    usageSecondsPerSession: avg((day) => day.usageSeconds ?? 0),
    maxBaseSkillActivationsPerSession: maxBase,
    requiredArrivalSecondsPerSession: requiredArrival,
    actualArrivalSecondsPerSession: avg((day) => day.actualArrivalRateSeconds ?? 0),
    placementBaseActivationsPerSession: placementDemand,
    existingPendingBaseActivationsPerSession: pendingBase,
    listeningRequiredPerSession: c8Applicable ? derived.requiredNewWordsPerSession : pendingBase / 2,
    productionRequiredPerSession: c8Applicable ? derived.requiredNewWordsPerSession : pendingBase / 2,
    listeningServedPerSession: listeningServed,
    productionServedPerSession: productionServed,
  });

  process.stdout.write(`${JSON.stringify({
    profile: profile.id,
    c8Applicable,
    requiredNewWordsPerSession: c8Applicable ? derived.requiredNewWordsPerSession : 0,
    requiredBaseActivationsPerSession: c8Applicable
      ? derived.requiredBaseActivationsPerSession
      : 0,
    actualBaseArrivalsProxyPerSession: pendingBase + placementDemand,
    baseServiceCapPerSession: maxBase,
    baseActivationsServedPerSession: baseServed,
    requiredBaseOver8: multi.baseActivations.requiredOverHorizon,
    capacityOver8: multi.baseActivations.serviceCapacityOverHorizon,
    placementBaseDemandPerSession: placementDemand,
    existingPendingPerSession: pendingBase,
    listeningServedPerSession: listeningServed,
    productionServedPerSession: productionServed,
    worstRollingWindowMargin: windows.worstMargin,
    firstInfeasibleWindowStart: windows.firstInfeasibleWindowStart,
    secondsStatus: multi.seconds.status,
    baseSlotStatus: multi.baseActivations.status,
    overallTargetStatus: c8Applicable ? multi.overallStatus : "not-applicable",
    bottlenecks: multi.bottlenecks,
    hypothesis96v32: profile.id === "steady"
      ? {
          required: derived.requiredBaseActivationsOverHorizon,
          service: maxBase * C9_HORIZON_SESSIONS,
          incompatible: derived.requiredBaseActivationsOverHorizon > maxBase * C9_HORIZON_SESSIONS,
        }
      : null,
  })}\n`);
}
