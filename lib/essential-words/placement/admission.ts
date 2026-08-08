import {
  backpressureFactor,
  type BaseBacklogPolicy,
} from "../pending-base-fairness";
import type { CapacityReservation } from "../planning-types";
import {
  hasProvisionalForecast,
  provisionalDueAt,
} from "../verification/provisional-intervals";
import type { AttemptModality, LearningItem } from "../verification/types";

/**
 * Fase 8 final simplification (docs/superpowers/plans/notes/
 * 2026-08-07-fase8-final-planner-simplification.md §7c/§8). Placement
 * respects the exact same pending-base backpressure as `admitNewWords` — a
 * converted candidate creates listening+production pending base obligations,
 * so it consumes the same backlog budget as any other base work.
 * `maxConversionsPerSession` remains only a safety ceiling layered on top of
 * the capacity-safe count, never a quota placement must fill.
 */
export interface PlacementAdmissionInput {
  candidates: readonly LearningItem[];
  maxConversionsPerSession: number;
  remainingSeconds: number;
  perConversionSeconds: number;
  estimatedSecondsByModality: Record<AttemptModality, number>;
  pendingBaseBacklogSeconds: number;
  backlogPolicy: BaseBacklogPolicy;
  now: Date;
  activeSessionDates: readonly Date[];
  safetyReserveShare?: number;
}

export interface PlacementAdmissionResult {
  admitted: LearningItem[];
  deferred: LearningItem[];
  capacitySafeConversions: number;
  newReservations: CapacityReservation[];
  status: "ready" | "insufficient-forecast";
  /** Candidate deferred purely by pending-base backpressure / budget. */
  rejectedForCapacity: number;
  /** Candidate was capacity-safe but `maxConversionsPerSession` was already reached. */
  rejectedForSafetyCeiling: number;
}

function toProvisional(item: LearningItem, dueAt: Date): LearningItem {
  return {
    ...item,
    schedule: {
      kind: "provisional",
      dueAt: dueAt.toISOString(),
      source: "placement-inference",
      evidenceConfidence: item.placementInference!.confidence,
    },
  };
}

function conversionReservations(
  wordId: string,
  costs: Record<AttemptModality, number>,
): [CapacityReservation, CapacityReservation] {
  return [
    {
      itemId: `${wordId}#listening`,
      source: "placement",
      skill: "listening",
      deadlineSession: 8,
      estimatedSeconds: costs.listening,
    },
    {
      itemId: `${wordId}#production`,
      source: "placement",
      skill: "production",
      deadlineSession: 8,
      estimatedSeconds: costs.production,
    },
  ];
}

export function admitPlacementConversions(
  input: PlacementAdmissionInput,
): PlacementAdmissionResult {
  const maxConversions = Number.isFinite(input.maxConversionsPerSession)
    ? Math.max(0, Math.floor(input.maxConversionsPerSession))
    : 0;
  const empty: PlacementAdmissionResult = {
    admitted: [],
    deferred: [...input.candidates],
    capacitySafeConversions: 0,
    newReservations: [],
    status: "ready",
    rejectedForCapacity: 0,
    rejectedForSafetyCeiling: 0,
  };

  if (!hasProvisionalForecast("inference", input.now, input.activeSessionDates)) {
    return { ...empty, status: "insufficient-forecast" };
  }

  const eligible = input.candidates.filter((item) => (
    item.placementInference && item.schedule.kind === "none"
  ));
  const deferredIneligible = input.candidates.filter((item) => (
    !item.placementInference || item.schedule.kind !== "none"
  ));

  const reserveShare = input.safetyReserveShare ?? 0.1;
  const safeRemainingSeconds = Math.max(0, input.remainingSeconds * (1 - reserveShare));
  const budgetSafeConversions = input.perConversionSeconds > 0
    ? Math.floor(safeRemainingSeconds / input.perConversionSeconds)
    : 0;
  const pressure = backpressureFactor(input.pendingBaseBacklogSeconds, input.backlogPolicy);
  const capacitySafeConversions = Math.max(0, Math.floor(budgetSafeConversions * pressure));

  const admitted: LearningItem[] = [];
  const deferred: LearningItem[] = [...deferredIneligible];
  const newReservations: CapacityReservation[] = [];
  let rejectedForCapacity = 0;
  let rejectedForSafetyCeiling = 0;

  for (const candidate of eligible) {
    if (admitted.length >= capacitySafeConversions) {
      deferred.push(candidate);
      rejectedForCapacity += 1;
      continue;
    }
    if (admitted.length >= maxConversions) {
      deferred.push(candidate);
      rejectedForSafetyCeiling += 1;
      continue;
    }
    const dueAt = provisionalDueAt("inference", candidate.id, input.now);
    admitted.push(toProvisional(candidate, dueAt));
    newReservations.push(...conversionReservations(
      candidate.wordId,
      input.estimatedSecondsByModality,
    ));
  }

  return {
    admitted,
    deferred,
    capacitySafeConversions,
    newReservations,
    status: "ready",
    rejectedForCapacity,
    rejectedForSafetyCeiling,
  };
}
