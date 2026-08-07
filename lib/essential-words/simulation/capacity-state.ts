import type { CapacityReservation, DailyPlan } from "../planning-types";
import type { SimulationWorld } from "./state";

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

export function updateSimulationCapacityReservations(
  world: SimulationWorld,
  plan: DailyPlan,
  completedIds: Set<string>,
): void {
  const next = new Map<string, CapacityReservation>();
  for (const reservation of plan.futureReservations) {
    if (completedIds.has(reservation.itemId)) continue;
    const wordId = reservation.itemId.split("#")[0];
    if (
      reservation.source === "new-word"
      && !world.words.get(wordId)?.introducedAt
    ) continue;
    const key = `${reservation.itemId}:${reservation.skill}`;
    if (!next.has(key)) next.set(key, reservation);
  }
  world.futureReservations = [...next.values()];
}
