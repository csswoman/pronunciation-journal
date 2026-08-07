import { buildCapacityForecast } from "./capacity-forecast";
import type {
  ActivationCandidate,
  CapacityReservation,
  DailyPlanningInput,
  PlannedItem,
} from "./planning-types";

export function orderDueReservationsFirst(
  candidates: ActivationCandidate[],
  dueReservations: CapacityReservation[],
): ActivationCandidate[] {
  const deadlines = new Map(dueReservations.map((reservation) => [
    reservation.itemId,
    reservation.deadlineSession,
  ]));
  return [...candidates].sort((left, right) => {
    const leftDeadline = deadlines.get(left.itemId) ?? Number.POSITIVE_INFINITY;
    const rightDeadline = deadlines.get(right.itemId) ?? Number.POSITIVE_INFINITY;
    return leftDeadline - rightDeadline;
  });
}

function pendingBaseReservations(
  candidates: ActivationCandidate[],
  input: DailyPlanningInput,
): CapacityReservation[] {
  return candidates.map((candidate) => ({
    itemId: candidate.itemId,
    source: "pending-base",
    skill: candidate.skill,
    deadlineSession: candidate.deadlineSession ?? 8,
    estimatedSeconds: input.estimatedSeconds.byModality[candidate.modality],
  }));
}

export function buildFutureCapacity(
  input: DailyPlanningInput,
  deferredMandatory: PlannedItem[],
  deferredBase: ActivationCandidate[],
) {
  return buildCapacityForecast({
    sessions: input.capacityForecast.sessions,
    mandatory: [
      ...input.capacityForecast.mandatory,
      ...deferredMandatory.map((item) => ({
        itemId: item.itemId,
        skill: item.skill,
        deadlineSession: 1,
        estimatedSeconds: input.estimatedSeconds.byModality[item.modality],
      })),
    ],
    pendingBase: pendingBaseReservations(deferredBase, input),
    futureReservations: input.capacityForecast.futureReservations,
  });
}

export function mergeReservations(
  reservations: CapacityReservation[],
): CapacityReservation[] {
  const byItemAndSkill = new Map<string, CapacityReservation>();
  for (const reservation of reservations) {
    const key = `${reservation.itemId}:${reservation.skill}`;
    if (!byItemAndSkill.has(key)) byItemAndSkill.set(key, reservation);
  }
  return [...byItemAndSkill.values()];
}
