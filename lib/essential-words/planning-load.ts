import type {
  ActivationSelection,
  CapacityReservation,
  DailyPlanningInput,
  PlannedItem,
  PlanningLoadBreakdown,
} from "./planning-types";

interface MandatorySelection {
  selected: PlannedItem[];
  deferred: PlannedItem[];
  seconds: number;
}

export function emptyLoadBreakdown(): PlanningLoadBreakdown {
  return {
    mandatoryReviewSeconds: 0,
    learningStepSeconds: 0,
    pendingBaseSeconds: 0,
    placementSeconds: 0,
    usageSeconds: 0,
    newWordSeconds: 0,
    deferredMandatorySeconds: 0,
    futureReservedSeconds: 0,
  };
}

export function buildLoadBreakdown(
  input: DailyPlanningInput,
  mandatory: MandatorySelection,
  base: ActivationSelection,
  usage: ActivationSelection,
  newWordSeconds: number,
  futureReservations: CapacityReservation[],
  placementReservationIds: Set<string>,
): PlanningLoadBreakdown {
  const byModality = input.estimatedSeconds.byModality;
  const learningIds = new Set(input.mandatory.learning.map((item) => item.itemId));
  let learningStepSeconds = 0;
  let mandatoryReviewSeconds = 0;
  for (const item of mandatory.selected) {
    const cost = byModality[item.modality];
    if (learningIds.has(item.itemId)) learningStepSeconds += cost;
    else mandatoryReviewSeconds += cost;
  }

  let pendingBaseSeconds = 0;
  let placementSeconds = 0;
  for (const item of base.selected) {
    const cost = byModality[item.modality];
    if (placementReservationIds.has(item.itemId)) placementSeconds += cost;
    else pendingBaseSeconds += cost;
  }

  return {
    mandatoryReviewSeconds,
    learningStepSeconds,
    pendingBaseSeconds,
    placementSeconds,
    usageSeconds: usage.seconds,
    newWordSeconds,
    deferredMandatorySeconds: mandatory.deferred.reduce(
      (total, item) => total + byModality[item.modality],
      0,
    ),
    futureReservedSeconds: futureReservations.reduce(
      (total, item) => total + item.estimatedSeconds,
      0,
    ),
  };
}
