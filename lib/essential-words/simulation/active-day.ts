import type { DailyPlan, CapacityReservation } from "../planning-types";
import { estimateItemsSeconds } from "../cost-estimate";
import type { AttemptModality } from "../verification/types";
import type { AppliedSessionSummary } from "./apply-session";
import type { SimulationCandidates, SimulationMandatory } from "./candidates";
import { buildActiveDayForecastTelemetry } from "./day-forecast-telemetry";
import {
  buildDeferredBaseDiagnostics,
} from "./base-wait";
import type { ActivationLimits } from "../planning-types";
import type { DailyPlanningInput } from "../planning-types";
import type { SimulatedDay } from "./types";
import type { SimulationWorld } from "./state";
import { oldestDeferredAge } from "./observations";

export function topBlockingReasonFromDiagnostics(
  diagnostics: ReturnType<typeof buildDeferredBaseDiagnostics>,
): string | null {
  const blockingCounts = new Map<string, number>();
  for (const diagnostic of diagnostics) {
    for (const entry of diagnostic.blockingReasons) {
      blockingCounts.set(entry.reason, (blockingCounts.get(entry.reason) ?? 0) + 1);
    }
  }
  return [...blockingCounts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))[0]
    ?.[0] ?? null;
}

export function buildActiveSimulatedDay(input: {
  date: string;
  profileId: string;
  dailyBudgetSeconds: number;
  targetNewWords: number;
  backlogSeconds: number;
  plan: DailyPlan;
  summary: AppliedSessionSummary;
  queueLength: number;
  completionsLength: number;
  deferredSize: number;
  mandatory: SimulationMandatory;
  candidates: SimulationCandidates;
  placementConversions: number;
  placementReservations: readonly CapacityReservation[];
  provisionalDueDistribution: Record<string, number>;
  waiting: { listening: number; production: number };
  world: SimulationWorld;
  sessionIndex: number;
  planningMandatory: DailyPlanningInput["capacityForecast"]["mandatory"];
  costs: Record<AttemptModality, number>;
  introductionSeconds: number;
  activationLimits: ActivationLimits;
}): SimulatedDay {
  const oldestPendingWait = Math.max(
    0,
    ...input.candidates.baseSkillActivations.map((item) => item.waitSessions ?? 0),
  );
  const servedListening = input.plan.baseSkillSelected
    .filter((item) => item.skill === "listening").length;
  const servedProduction = input.plan.baseSkillSelected
    .filter((item) => item.skill === "production").length;
  const pendingBaseDemandSeconds = input.waiting.listening * input.costs.listening
    + input.waiting.production * input.costs.production;
  const pendingBaseReservationSeconds = input.plan.futureReservations
    .filter((item) => item.source === "pending-base")
    .reduce((total, item) => total + item.estimatedSeconds, 0);
  const pendingBaseSeconds = Math.max(
    pendingBaseDemandSeconds,
    pendingBaseReservationSeconds,
    input.plan.loadBreakdown.pendingBaseSeconds,
  );
  const mandatorySeconds = estimateItemsSeconds(
    input.plan.mandatorySelected,
    input.costs,
  );
  const remainingAfterMandatory = Math.max(
    0,
    input.dailyBudgetSeconds - mandatorySeconds,
  );
  const selectedBaseSeconds = input.plan.baseSkillSelected
    .reduce((total, item) => total + input.costs[item.modality], 0);
  const remainingBaseSlots = Math.max(
    0,
    input.activationLimits.maxBaseSkillActivationsPerSession
      - input.plan.baseSkillSelected.length,
  );
  const topBaseBlockingReason = topBlockingReasonFromDiagnostics(
    buildDeferredBaseDiagnostics({
      sessionIndex: input.sessionIndex,
      candidates: input.candidates.baseSkillActivations,
      selected: input.plan.baseSkillSelected,
      remainingBudgetSeconds: Math.max(0, remainingAfterMandatory - selectedBaseSeconds),
      remainingBaseSlots,
      hardMandatoryRemainingSeconds: input.plan.deferredMandatory
        .reduce((total, item) => total + input.costs[item.modality], 0),
      placementReservationSeconds: input.placementReservations
        .reduce((total, item) => total + item.estimatedSeconds, 0),
      usageReservationSeconds: input.plan.usageSelected.length * input.costs.production,
      costs: input.costs,
    }),
  );
  const forecastTelemetry = buildActiveDayForecastTelemetry({
    profileId: input.profileId,
    dailyBudgetSeconds: input.dailyBudgetSeconds,
    targetNewWords: input.targetNewWords,
    newWords: input.summary.newWords,
    usageActivations: input.summary.usageActivations,
    completedSeconds: input.summary.completedSeconds,
    costs: input.costs,
    introductionSeconds: input.introductionSeconds,
    futureMandatory: input.planningMandatory,
    futureReservations: input.plan.futureReservations,
    placementReservations: input.placementReservations,
    pendingBaseSeconds,
    oldestPendingWait,
    servedListening,
    servedProduction,
    capacitySafeNewWords: input.plan.allowance.capacitySafeNewWords,
    pendingBaseCount: input.waiting.listening + input.waiting.production,
  });

  return {
    date: input.date,
    active: true,
    dailyBudgetSeconds: input.dailyBudgetSeconds,
    plannedSeconds: input.plan.allowance.plannedSeconds,
    completedSeconds: input.summary.completedSeconds,
    plannedItems: input.queueLength,
    completedItems: input.completionsLength,
    mandatorySelected: input.plan.mandatorySelected.length,
    deferredMandatory: input.deferredSize,
    backlogSeconds: input.backlogSeconds,
    mode: input.plan.allowance.mode,
    newWords: input.summary.newWords,
    baseSkillActivations: input.summary.baseSkillActivations,
    newWordMeaningActivations: input.summary.newWords,
    usageActivations: input.summary.usageActivations,
    provisionalDue: input.mandatory.provisionalDue.length,
    placementCandidates: input.candidates.placementCandidates.length,
    placementConversions: input.placementConversions,
    placementConversionsDeferred: input.plan.placementDeferred,
    placementReservedSeconds: input.placementReservations.reduce(
      (total, item) => total + item.estimatedSeconds,
      0,
    ),
    placementListeningReservations: input.placementReservations
      .filter((item) => item.skill === "listening").length,
    placementProductionReservations: input.placementReservations
      .filter((item) => item.skill === "production").length,
    provisionalDueDistribution: input.provisionalDueDistribution,
    scheduledReviews: input.summary.scheduledReviews,
    correctScheduledReviews: input.summary.correctScheduledReviews,
    oldestDeferredAgeSessions: oldestDeferredAge(input.world),
    listeningEligibleWaiting: input.waiting.listening,
    productionEligibleWaiting: input.waiting.production,
    ...forecastTelemetry,
    topBaseBlockingReason,
  };
}
