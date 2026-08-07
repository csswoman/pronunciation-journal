import {
  reserveCapacity,
  type CapacityForecast,
} from "./capacity-forecast";
import type {
  CapacityReservation,
  NewWordCandidate,
} from "./planning-types";
import type { AttemptModality } from "./verification/types";

export interface NewWordAdmissionInput {
  candidates: readonly NewWordCandidate[];
  configuredNewWordLimit: number;
  forecast: CapacityForecast;
  estimatedSecondsByModality: Record<AttemptModality, number>;
}

export interface NewWordAdmissionResult {
  admitted: NewWordCandidate[];
  capacitySafeNewWords: number;
  newReservations: CapacityReservation[];
  forecast: CapacityForecast;
}

interface ReservedPair {
  forecast: CapacityForecast;
  reservations: [CapacityReservation, CapacityReservation];
}

function reservation(
  wordId: string,
  skill: "listening" | "production",
  estimatedSeconds: number,
): CapacityReservation {
  return {
    itemId: `${wordId}#${skill}`,
    source: "new-word",
    skill,
    deadlineSession: 8,
    estimatedSeconds,
  };
}

function reservePair(
  forecast: CapacityForecast,
  candidate: NewWordCandidate,
  costs: Record<AttemptModality, number>,
): ReservedPair | null {
  const listening = reserveCapacity(
    forecast,
    reservation(candidate.wordId, "listening", costs.listening),
  );
  if (!listening) return null;
  const production = reserveCapacity(
    listening.forecast,
    reservation(candidate.wordId, "production", costs.production),
    listening.reservation.deadlineSession + 1,
  );
  if (!production) return null;
  return {
    forecast: production.forecast,
    reservations: [listening.reservation, production.reservation],
  };
}

export function admitNewWords(input: NewWordAdmissionInput): NewWordAdmissionResult {
  const configuredLimit = Number.isFinite(input.configuredNewWordLimit)
    ? Math.max(0, Math.floor(input.configuredNewWordLimit))
    : 0;
  let capacityForecast = input.forecast;
  let committedForecast = input.forecast;
  const admitted: NewWordCandidate[] = [];
  const newReservations: CapacityReservation[] = [];
  const seenWordIds = new Set<string>();

  if (
    capacityForecast.status !== "ready"
    || capacityForecast.unreservedItemIds.length > 0
  ) {
    return {
      admitted,
      capacitySafeNewWords: 0,
      newReservations,
      forecast: committedForecast,
    };
  }

  const candidates = [...input.candidates].sort((left, right) => (
    left.rank - right.rank || left.wordId.localeCompare(right.wordId)
  ));
  let capacitySafeNewWords = 0;
  for (const candidate of candidates) {
    if (seenWordIds.has(candidate.wordId)) continue;
    seenWordIds.add(candidate.wordId);
    const pair = reservePair(
      capacityForecast,
      candidate,
      input.estimatedSecondsByModality,
    );
    if (!pair) continue;
    capacityForecast = pair.forecast;
    capacitySafeNewWords += 1;
    if (admitted.length >= configuredLimit) continue;
    committedForecast = pair.forecast;
    admitted.push(candidate);
    newReservations.push(...pair.reservations);
  }

  return {
    admitted,
    capacitySafeNewWords,
    newReservations,
    forecast: committedForecast,
  };
}
