import {
  backpressureFactor,
  type BaseBacklogPolicy,
} from "./pending-base-fairness";
import type {
  CapacityReservation,
  NewWordCandidate,
} from "./planning-types";
import type { AttemptModality } from "./verification/types";
import type { BaseBackpressure } from "./base-backpressure";

export {
  admitPlacementConversions,
  type PlacementAdmissionInput,
  type PlacementAdmissionResult,
} from "./placement/admission";

/**
 * Fase 8 final simplification (docs/superpowers/plans/notes/
 * 2026-08-07-fase8-final-planner-simplification.md §7d). `admitNewWords` is
 * now `min(target, capacityEstimate)`: no 8-session reservation ledger, no
 * FSRS-debt envelope layered twice. `capacityEstimate` derives directly from
 * remaining seconds and the same pending-base backpressure that gates
 * placement (§7/§8 of the encargo) — a small safety reserve protects against
 * per-word cost underestimation, nothing more.
 */
export interface NewWordAdmissionInput {
  candidates: readonly NewWordCandidate[];
  configuredNewWordLimit: number;
  remainingSeconds: number;
  perNewWordSeconds: number;
  estimatedSecondsByModality: Record<AttemptModality, number>;
  pendingBaseBacklogSeconds: number;
  backlogPolicy: BaseBacklogPolicy;
  baseBackpressure?: BaseBackpressure;
  /** Share of remainingSeconds held back for estimation error. Default 0.1. */
  safetyReserveShare?: number;
}

export type NewWordAdmissionLimit =
  | "target"
  | "budget"
  | "pending-base-backpressure"
  | "recovery";

export interface NewWordAdmissionResult {
  admitted: NewWordCandidate[];
  capacitySafeNewWords: number;
  newReservations: CapacityReservation[];
  limitingFactor: NewWordAdmissionLimit;
}

function newWordReservations(
  wordId: string,
  costs: Record<AttemptModality, number>,
): [CapacityReservation, CapacityReservation] {
  return [
    {
      itemId: `${wordId}#listening`,
      source: "new-word",
      skill: "listening",
      deadlineSession: 8,
      estimatedSeconds: costs.listening,
    },
    {
      itemId: `${wordId}#production`,
      source: "new-word",
      skill: "production",
      deadlineSession: 8,
      estimatedSeconds: costs.production,
    },
  ];
}

const NEW_WORD_BASE_OBLIGATIONS = 2;

export function admitNewWords(input: NewWordAdmissionInput): NewWordAdmissionResult {
  const configuredLimit = Number.isFinite(input.configuredNewWordLimit)
    ? Math.max(0, Math.floor(input.configuredNewWordLimit))
    : 0;
  const reserveShare = input.safetyReserveShare ?? 0.3;
  const safeRemainingSeconds = Math.max(
    0,
    input.remainingSeconds * (1 - reserveShare),
  );

  const budgetSafeNewWords = input.perNewWordSeconds > 0
    ? Math.floor(safeRemainingSeconds / input.perNewWordSeconds)
    : 0;
  const pressure = backpressureFactor(input.pendingBaseBacklogSeconds, input.backlogPolicy);
  const backlogSafeNewWords = input.baseBackpressure
    ? Math.floor(
        input.baseBackpressure.availableObligationCapacity
          / NEW_WORD_BASE_OBLIGATIONS,
      )
    : Math.floor(budgetSafeNewWords * pressure);
  const capacityEstimate = Math.min(budgetSafeNewWords, backlogSafeNewWords);

  let limitingFactor: NewWordAdmissionLimit;
  if (capacityEstimate >= configuredLimit) {
    limitingFactor = "target";
  } else if (
    (input.baseBackpressure && backlogSafeNewWords < budgetSafeNewWords)
    || (!input.baseBackpressure && pressure < 1 && capacityEstimate < budgetSafeNewWords)
  ) {
    limitingFactor = "pending-base-backpressure";
  } else {
    limitingFactor = "budget";
  }

  const capacitySafeNewWords = Math.max(0, capacityEstimate);
  const admittedCount = Math.min(configuredLimit, capacitySafeNewWords);

  const candidates = [...input.candidates].sort((left, right) => (
    left.rank - right.rank || left.wordId.localeCompare(right.wordId)
  ));
  const seenWordIds = new Set<string>();
  const admitted: NewWordCandidate[] = [];
  const newReservations: CapacityReservation[] = [];
  for (const candidate of candidates) {
    if (admitted.length >= admittedCount) break;
    if (seenWordIds.has(candidate.wordId)) continue;
    seenWordIds.add(candidate.wordId);
    admitted.push(candidate);
    newReservations.push(...newWordReservations(candidate.wordId, input.estimatedSecondsByModality));
  }

  return {
    admitted,
    capacitySafeNewWords,
    newReservations,
    limitingFactor,
  };
}
