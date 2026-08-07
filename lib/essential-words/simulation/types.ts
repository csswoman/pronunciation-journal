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
  feasibilityStatus: "feasible" | "infeasible" | "n/a";
  serviceRateSeconds?: number;
  arrivalRateSeconds?: number;
  arrivalMinusServiceSeconds?: number;
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
