import { buildCapacityForecast, type CapacityForecast } from "./capacity-forecast";
import {
  rankPendingBaseCandidates,
  toPendingBaseCandidate,
} from "./pending-base-fairness";
import type {
  ActivationCandidate,
  CapacityReservation,
  DailyPlanningInput,
  PlannedItem,
} from "./planning-types";

/**
 * Orders pending-base candidates with C9 fairness (Task 8.9c).
 * Due reservations still inform deadlineSession when present.
 */
export function orderDueReservationsFirst(
  candidates: ActivationCandidate[],
  dueReservations: CapacityReservation[],
): ActivationCandidate[] {
  const deadlines = new Map(dueReservations.map((reservation) => [
    reservation.itemId,
    reservation.deadlineSession,
  ]));
  const enriched = candidates.map((candidate) => {
    const deadline = deadlines.get(candidate.itemId);
    const waitFromDeadline = deadline !== undefined
      ? Math.max(0, 8 - deadline)
      : candidate.waitSessions ?? 0;
    return toPendingBaseCandidate(candidate, {
      waitSessions: Math.max(candidate.waitSessions ?? 0, waitFromDeadline),
      deadlineSession: deadline ?? candidate.deadlineSession,
    });
  });
  return rankPendingBaseCandidates(enriched);
}

function pendingBaseReservations(
  candidates: ActivationCandidate[],
  input: DailyPlanningInput,
): CapacityReservation[] {
  return candidates.map((candidate) => ({
    itemId: candidate.itemId,
    source: "pending-base" as const,
    skill: candidate.skill,
    deadlineSession: candidate.deadlineSession ?? 8,
    estimatedSeconds: input.estimatedSeconds.byModality[candidate.modality],
  }));
}

export function buildFutureCapacity(
  input: DailyPlanningInput,
  deferredMandatory: PlannedItem[],
  deferredBase: ActivationCandidate[],
): CapacityForecast {
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
    futureReservations: input.capacityForecast.futureReservations
      .filter((reservation) => reservation.deadlineSession <= 8),
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
