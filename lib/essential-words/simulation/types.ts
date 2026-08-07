import type { AttemptLog, SrsReviewEvent } from "../verification/types";
import type { DeferredObservation, EligibilityObservation } from "./criteria";
import type {
  SimulationOptions,
  SimulationWorld,
  SimulationWorldCounts,
} from "./state";

export interface SimulatedDay {
  date: string;
  active: boolean;
  dailyBudgetSeconds: number;
  plannedSeconds: number;
  completedSeconds: number;
  plannedItems: number;
  completedItems: number;
  mandatorySelected: number;
  deferredMandatory: number;
  backlogSeconds: number;
  mode: "normal" | "recovery";
  newWords: number;
  baseSkillActivations: number;
  newWordMeaningActivations: number;
  usageActivations: number;
  provisionalDue: number;
  placementCandidates: number;
  placementConversions: number;
  placementConversionsDeferred: number;
  /** Task 8.9k §9 — placement admission telemetry, aggregate-C9-safe. */
  placementCapacitySafeConversions?: number;
  placementRejectedForCapacity?: number;
  placementRejectedForSafetyCeiling?: number;
  placementRejectedForAggregateC9?: number;
  placementReservedSeconds: number;
  placementListeningReservations: number;
  placementProductionReservations: number;
  provisionalDueDistribution: Record<string, number>;
  scheduledReviews: number;
  correctScheduledReviews: number;
  oldestDeferredAgeSessions: number;
  listeningEligibleWaiting: number;
  productionEligibleWaiting: number;
  /** Task 8.9b — hard future mandatory reserved across next 8 active sessions. */
  futureMandatoryReservedSeconds: number;
  expectedFsrsDebtSeconds: number;
  futureResidualSeconds: number;
  admissionDemandSeconds: number;
  feasibilityStatus: "feasible" | "marginal" | "infeasible" | "n/a";
  actualFeasibilityStatus?: "feasible" | "marginal" | "infeasible";
  targetFeasibilityStatus?: "feasible" | "marginal" | "infeasible" | "n/a";
  serviceRateSeconds?: number;
  /** @deprecated Prefer actualArrivalRateSeconds */
  arrivalRateSeconds?: number;
  actualArrivalRateSeconds?: number;
  requiredArrivalRateSeconds?: number;
  arrivalMinusServiceSeconds?: number;
  targetMarginSeconds?: number | null;
  c8CriterionApplicable?: boolean;
  pendingBaseCount?: number;
  oldestPendingWait?: number;
  servedListening?: number;
  servedProduction?: number;
  capacitySafeNewWords?: number;
  committedMandatorySeconds?: number;
  committedBaseSeconds?: number;
  committedPlacementSeconds?: number;
  usageSeconds?: number;
  topBaseBlockingReason?: string | null;
  /** Seconds consumed by mandatory selected in this session (Task 8.9e). */
  mandatorySelectedSeconds?: number;
  dynamicBaseAllowanceMax?: number;
  dynamicBaseLimitingFactor?: string;
}

export interface SimulationResult {
  days: SimulatedDay[];
  world: SimulationWorld;
  worldCounts: SimulationWorldCounts;
  attemptLogs: AttemptLog[];
  srsEvents: SrsReviewEvent[];
  eligibility: EligibilityObservation[];
  deferredObservations: DeferredObservation[];
  nonTrivialFailures: string[];
  maxDeferredAgeSessions: number;
  options: SimulationOptions;
}
