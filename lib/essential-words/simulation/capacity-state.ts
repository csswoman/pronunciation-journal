import type { CapacityReservation, DailyPlan } from "../planning-types";
import type { SimulationWorld } from "./state";

function reservationKey(reservation: CapacityReservation): string {
  return `${reservation.itemId}:${reservation.skill}`;
}

function shouldKeepReservation(
  reservation: CapacityReservation,
  completedIds: Set<string>,
  world: SimulationWorld,
): boolean {
  if (completedIds.has(reservation.itemId)) return false;
  if (reservation.source !== "new-word") return true;
  const wordId = reservation.itemId.split("#")[0];
  return Boolean(world.words?.get(wordId)?.introducedAt);
}

export function beginActiveSessionReservations(
  world: SimulationWorld,
): CapacityReservation[] {
  const due = world.futureReservations
    .filter((reservation) => reservation.deadlineSession <= 1);
  world.futureReservations = world.futureReservations
    .filter((reservation) => reservation.deadlineSession > 1)
    .map((reservation) => ({
      ...reservation,
      deadlineSession: reservation.deadlineSession - 1,
    }));
  return due;
}

/**
 * Persists capacity debt across sessions.
 * Plan reservations win on conflict; incomplete world debt is preserved when
 * the rebuilt plan dropped it (e.g. temporary unreserved pressure).
 */
export function updateSimulationCapacityReservations(
  world: SimulationWorld,
  plan: DailyPlan,
  completedIds: Set<string>,
): void {
  const next = new Map<string, CapacityReservation>();

  for (const reservation of world.futureReservations) {
    if (!shouldKeepReservation(reservation, completedIds, world)) continue;
    next.set(reservationKey(reservation), reservation);
  }

  for (const reservation of plan.futureReservations) {
    if (!shouldKeepReservation(reservation, completedIds, world)) continue;
    next.set(reservationKey(reservation), reservation);
  }

  world.futureReservations = [...next.values()];
}
