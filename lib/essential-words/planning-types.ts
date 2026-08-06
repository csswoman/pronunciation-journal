import type { AttemptModality, Skill } from "./verification/types";

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
}

/** A word not yet introduced to the learner. */
export interface NewWordCandidate {
  wordId: string;
  rank: number;
}

export interface DailyPlanningInput {
  dailyBudgetSeconds: number;
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
}

export interface DailyAllowance {
  newWords: number;
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

export interface DailyPlan {
  allowance: DailyAllowance;
  mandatorySelected: PlannedItem[];
  deferredMandatory: PlannedItem[];
  baseSkillSelected: ActivationCandidate[];
  usageSelected: ActivationCandidate[];
  newWordsSelected: NewWordCandidate[];
}
