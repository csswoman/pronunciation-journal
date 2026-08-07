import {
  reserveCapacity,
  type CapacityForecast,
} from "./capacity-forecast";
import type { AdmissionLoadEnvelope } from "./admission-envelope";
import { applyExpectedFsrsReserve } from "./hard-mandatory-forecast";
import type {
  CapacityReservation,
  NewWordCandidate,
} from "./planning-types";
import type { AttemptModality } from "./verification/types";

export {
  admitPlacementConversions,
  type PlacementAdmissionInput,
  type PlacementAdmissionResult,
} from "./placement/admission";

export interface NewWordAdmissionInput {
  candidates: readonly NewWordCandidate[];
  configuredNewWordLimit: number;
  forecast: CapacityForecast;
  estimatedSecondsByModality: Record<AttemptModality, number>;
  /** Optional FSRS future-load envelope; defaults to simulation-model v1. */
  admissionEnvelope?: AdmissionLoadEnvelope;
  introductionSeconds?: number;
}

export interface NewWordAdmissionResult {
  admitted: NewWordCandidate[];
  capacitySafeNewWords: number;
  newReservations: CapacityReservation[];
  forecast: CapacityForecast;
  expectedFsrsReservedSeconds: number;
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
  envelope: AdmissionLoadEnvelope | undefined,
): ReservedPair | null {
  const baseForecast: CapacityForecast = envelope
    ? {
        ...forecast,
        sessions: applyExpectedFsrsReserve(
          forecast.sessions,
          envelope.expectedReviewSecondsBySession,
        ),
      }
    : forecast;
  const listening = reserveCapacity(
    baseForecast,
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
  const envelope = input.admissionEnvelope;
  let capacityForecast = input.forecast;
  let committedForecast = input.forecast;
  const admitted: NewWordCandidate[] = [];
  const newReservations: CapacityReservation[] = [];
  const seenWordIds = new Set<string>();
  let expectedFsrsReservedSeconds = 0;

  if (
    capacityForecast.status !== "ready"
    || capacityForecast.unreservedItemIds.length > 0
  ) {
    return {
      admitted,
      capacitySafeNewWords: 0,
      newReservations,
      forecast: committedForecast,
      expectedFsrsReservedSeconds: 0,
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
      envelope,
    );
    if (!pair) continue;
    capacityForecast = pair.forecast;
    capacitySafeNewWords += 1;
    const reviewSeconds = envelope
      ? envelope.expectedReviewSecondsBySession.reduce((total, value) => total + value, 0)
      : 0;
    if (admitted.length >= configuredLimit) continue;
    committedForecast = pair.forecast;
    admitted.push(candidate);
    newReservations.push(...pair.reservations);
    expectedFsrsReservedSeconds += reviewSeconds;
  }

  return {
    admitted,
    capacitySafeNewWords,
    newReservations,
    forecast: committedForecast,
    expectedFsrsReservedSeconds,
  };
}
