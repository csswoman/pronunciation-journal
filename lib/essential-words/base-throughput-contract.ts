import { C9_BASE_ACTIVATION_LIMIT } from "./pending-base-fairness";

/** Task 8.9d — base throughput contract constants + documentation. */
export const BASE_THROUGHPUT_CONTRACT_VERSION = "base-throughput-contract-v1";

/** C9 horizon in active sessions — do not change. */
export const C9_HORIZON_SESSIONS = C9_BASE_ACTIVATION_LIMIT;

/**
 * Base skills the C9 contract requires activating after a word is introduced
 * (discovered from the Essential Words skill model — not a free parameter).
 */
export const REQUIRED_BASE_SKILLS_WITHIN_C9 = ["listening", "production"] as const;

export type RequiredBaseSkill = (typeof REQUIRED_BASE_SKILLS_WITHIN_C9)[number];

export interface MaxBaseSkillActivationsContractDoc {
  version: string;
  /** Enforced as selection ceiling in planDailySession (with due override). */
  isHardCap: boolean;
  /** Originated as structural safety default in Task 8.9 calibration. */
  isSafetyDefaultOrigin: boolean;
  jointListeningAndProduction: boolean;
  /** Placement conversions use a separate admission path. */
  placementConsumesSameSelectionCap: boolean;
  /** Learning/mandatory use selectMandatory, not maxBase. */
  learningStepsConsumeSameSelectionCap: boolean;
  /**
   * dueBaseCount can raise the effective selection max above
   * maxBaseSkillActivationsPerSession for already-due reservations.
   */
  dueReservationCanRaiseCap: boolean;
  notes: string;
}

/**
 * Documentary answers for Task 8.9d §3 — behaviour of the LIVE planner.
 * Does not change meaning of the cap.
 */
export function describeMaxBaseSkillActivationsContract(): MaxBaseSkillActivationsContractDoc {
  return {
    version: BASE_THROUGHPUT_CONTRACT_VERSION,
    isHardCap: true,
    isSafetyDefaultOrigin: true,
    jointListeningAndProduction: true,
    placementConsumesSameSelectionCap: false,
    learningStepsConsumeSameSelectionCap: false,
    dueReservationCanRaiseCap: true,
    notes: [
      "A. Hard cap for pending-base selection: selectActivations maximum is",
      "max(maxBase - consumed, dueBaseCount). Without due overrides, service ≤ 4.",
      "B. Introduced as a safety/default structural knob in Task 8.9; still enforced.",
      "C. Shared across listening+production (one counter).",
      "D. Placement does not consume the selection cap at conversion time; created",
      "listening/production later compete for the same maxBase slots.",
      "E. Learning steps / mandatory reviews use selectMandatory, not maxBase.",
      "Feasibility for C8 target demand models serviceCapacity = maxBase (no due",
      "override), because due exceptions serve inherited debt rather than creating",
      "capacity for 12 new-word activations/session.",
    ].join(" "),
  };
}

export function deriveRequiredBaseActivations(input: {
  configuredNewWordsTarget: number;
  minimumC8Share: number;
  horizonSessions?: number;
  requiredBaseSkills?: readonly RequiredBaseSkill[];
}): {
  requiredNewWordsPerSession: number;
  requiredBaseActivationsPerWord: number;
  requiredBaseActivationsPerSession: number;
  requiredBaseActivationsOverHorizon: number;
  horizonSessions: number;
  requiredBaseSkills: readonly RequiredBaseSkill[];
} {
  const skills = input.requiredBaseSkills ?? REQUIRED_BASE_SKILLS_WITHIN_C9;
  const horizon = input.horizonSessions ?? C9_HORIZON_SESSIONS;
  const requiredNewWordsPerSession = Math.ceil(
    input.configuredNewWordsTarget * input.minimumC8Share,
  );
  const requiredBaseActivationsPerWord = skills.length;
  const requiredBaseActivationsPerSession = requiredNewWordsPerSession
    * requiredBaseActivationsPerWord;
  return {
    requiredNewWordsPerSession,
    requiredBaseActivationsPerWord,
    requiredBaseActivationsPerSession,
    requiredBaseActivationsOverHorizon: requiredBaseActivationsPerSession * horizon,
    horizonSessions: horizon,
    requiredBaseSkills: skills,
  };
}

export interface BaseActivationDemandItem {
  itemId: string;
  skill: "listening" | "production";
}

/** Ownership after dedupe: pending > placement > new-words. */
export function reconcileBaseActivationDemand(input: {
  requiredFromNewWords: readonly BaseActivationDemandItem[];
  requiredFromPlacement: readonly BaseActivationDemandItem[];
  requiredFromExistingPending: readonly BaseActivationDemandItem[];
}): {
  requiredFromNewWords: number;
  requiredFromPlacement: number;
  requiredFromExistingPending: number;
  totalRequiredBaseActivations: number;
  items: BaseActivationDemandItem[];
} {
  const ownership = new Map<string, "new-words" | "placement" | "pending">();
  const order: Array<"new-words" | "placement" | "pending"> = [
    "pending",
    "placement",
    "new-words",
  ];
  const buckets = {
    pending: input.requiredFromExistingPending,
    placement: input.requiredFromPlacement,
    "new-words": input.requiredFromNewWords,
  } as const;

  for (const source of order) {
    for (const item of buckets[source]) {
      if (!ownership.has(item.itemId)) ownership.set(item.itemId, source);
    }
  }

  let requiredFromNewWords = 0;
  let requiredFromPlacement = 0;
  let requiredFromExistingPending = 0;
  const items: BaseActivationDemandItem[] = [];
  for (const [itemId, source] of ownership) {
    const skill: "listening" | "production" = itemId.includes("#production")
      ? "production"
      : "listening";
    items.push({ itemId, skill });
    if (source === "new-words") requiredFromNewWords += 1;
    else if (source === "placement") requiredFromPlacement += 1;
    else requiredFromExistingPending += 1;
  }

  return {
    requiredFromNewWords,
    requiredFromPlacement,
    requiredFromExistingPending,
    totalRequiredBaseActivations: ownership.size,
    items,
  };
}
