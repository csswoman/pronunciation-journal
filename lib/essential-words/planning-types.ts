import type {
  AttemptModality,
  LearningItem,
  Skill,
} from "./verification/types";
import type { BaseBackpressure, BaseServiceSample } from "./base-backpressure";

/** An already-scheduled item that competes for the daily time budget. */
export interface PlannedItem {
  itemId: string;
  wordId: string;
  skill: Skill;
  modality: AttemptModality;
  dueAt: string;
  retrievability?: number;
}

/** A pre-existing skill that may be activated if time remains after reviews. */
export interface ActivationCandidate {
  itemId: string;
  wordId: string;
  skill: Skill;
  modality: AttemptModality;
  deadlineSession?: number;
  /** Sessions waited while eligible (Task 8.9c fairness). */
  waitSessions?: number;
  firstEligibleSession?: number;
  admittedSession?: number;
  /** Origin hint for service priority (Task 8.9e). */
  source?: "pending-base" | "placement" | "usage" | "new-word";
}

/** A word not yet introduced to the learner. */
export interface NewWordCandidate {
  wordId: string;
  rank: number;
}

export interface ForecastSessionCapacity {
  sessionOffset: number;
  availableSeconds: number;
  listeningSeconds: number;
  productionSeconds: number;
}

export interface CapacityReservation {
  itemId: string;
  source: "pending-base" | "placement" | "usage" | "new-word";
  skill: Skill;
  deadlineSession: number;
  estimatedSeconds: number;
}

export interface ForecastCapacityDemand {
  itemId: string;
  skill: Skill;
  deadlineSession: number;
  estimatedSeconds: number;
}

/** Future load created by converting one PlacementInference. */
export interface PlacementConversionDemand {
  inferenceId: string;
  wordId: string;
  reservations: Array<{
    itemId: string;
    skill: "listening" | "production";
    estimatedSeconds: number;
    deadlineSession: number;
  }>;
  provisionalDemand?: Array<{
    itemId: string;
    estimatedSeconds: number;
    dueWindowStartSession: number;
    dueWindowEndSession: number;
  }>;
}

/** Planned seconds separated by source — never a generic "skill" bucket. */
export interface PlanningLoadBreakdown {
  mandatoryReviewSeconds: number;
  learningStepSeconds: number;
  pendingBaseSeconds: number;
  placementSeconds: number;
  usageSeconds: number;
  newWordSeconds: number;
  deferredMandatorySeconds: number;
  futureReservedSeconds: number;
}

export interface PlacementPlanningContext {
  now: Date;
  maxConversionsPerSession: number;
  activeSessionDates: readonly Date[];
}

export interface CapacityForecastPlanningInput {
  sessions: ForecastSessionCapacity[];
  mandatory: ForecastCapacityDemand[];
  dueReservations: CapacityReservation[];
  futureReservations: CapacityReservation[];
}

export interface DailyPlanningInput {
  dailyBudgetSeconds: number;
  configuredNewWordLimit: number;
  mandatory: {
    learning: PlannedItem[];
    overdue: PlannedItem[];
    dueToday: PlannedItem[];
    provisionalDue: PlannedItem[];
  };
  candidates: {
    baseSkillActivations: ActivationCandidate[];
    usageActivations: ActivationCandidate[];
    newWords: NewWordCandidate[];
    placementCandidates?: LearningItem[];
  };
  estimatedSeconds: {
    byModality: Record<AttemptModality, number>;
    newWordIntroduction: number;
  };
  consumed: {
    baseSkillActivations: number;
    usageActivations: number;
    newWords: number;
  };
  previousMode: "normal" | "recovery";
  /** Outcomes from the latest active sessions; empty means startup. */
  recentBaseService?: readonly BaseServiceSample[];
  /** All current L/P debt, including skills still gated by domain policy. */
  pendingBaseObligationCount?: number;
  /** Completed new usage activations in prior active sessions, oldest first. */
  recentUsageActivations?: readonly number[];
  capacityForecast: CapacityForecastPlanningInput;
  placementContext?: PlacementPlanningContext;
}

export interface DailyAllowance {
  newWords: number;
  capacitySafeNewWords: number;
  baseSkillActivations: number;
  usageActivations: number;
  newWordMeaningActivations: number;
  /** Derived telemetry; it must never cap base candidates. */
  totalSkillActivations: number;
  plannedSeconds: number;
  mode: "normal" | "recovery";
  /** Task 8.9e — realized dynamic base allowance for the session. */
  dynamicBaseAllowanceMax?: number;
  dynamicBaseLimitingFactor?: string;
}

export interface ActivationLimits {
  /**
   * Absolute runaway ceiling for base activations (Task 8.9e).
   * Not an operational target — dynamic allowance packs by residual capacity.
   */
  absoluteBaseActivationSafetyCeiling: number;
  maxUsageActivationsPerSession: number;
  /** Active-session window used to pace completed new usage activations. */
  usageActivationWindowSessions?: number;
  /** Maximum completed new usage activations in the active-session window. */
  maxUsageActivationsPerWindow?: number;
  maxPerItemPerSession: number;
  /**
   * @deprecated Use absoluteBaseActivationSafetyCeiling (Task 8.9e).
   * Kept temporarily for call-site migration.
   */
  maxBaseSkillActivationsPerSession?: number;
}

export interface ActivationSelection {
  selected: ActivationCandidate[];
  deferred: ActivationCandidate[];
  seconds: number;
  dynamicBaseAllowanceMax?: number;
  dynamicBaseLimitingFactor?: string;
}

export interface DailyPlan {
  allowance: DailyAllowance;
  mandatorySelected: PlannedItem[];
  deferredMandatory: PlannedItem[];
  baseSkillSelected: ActivationCandidate[];
  usageSelected: ActivationCandidate[];
  newWordsSelected: NewWordCandidate[];
  placementSelected: LearningItem[];
  placementDeferred: number;
  /** Placement admission telemetry for this session (encargo §18). */
  placementCapacity?: {
    capacitySafeConversions: number;
    rejectedForCapacity: number;
    rejectedForSafetyCeiling: number;
  };
  baseBackpressure?: BaseBackpressure;
  futureReservations: CapacityReservation[];
  loadBreakdown: PlanningLoadBreakdown;
}
