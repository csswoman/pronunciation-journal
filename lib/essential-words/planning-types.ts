import type {
  AttemptModality,
  LearningItem,
  Skill,
} from "./verification/types";

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
}

export interface ActivationLimits {
  maxBaseSkillActivationsPerSession: number;
  maxUsageActivationsPerSession: number;
  maxPerItemPerSession: number;
}

export interface ActivationSelection {
  selected: ActivationCandidate[];
  deferred: ActivationCandidate[];
  seconds: number;
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
  futureReservations: CapacityReservation[];
  loadBreakdown: PlanningLoadBreakdown;
}
