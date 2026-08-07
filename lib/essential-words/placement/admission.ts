import {
  reserveCapacity,
  type CapacityForecast,
} from "../capacity-forecast";
import type { CapacityReservation } from "../planning-types";
import {
  activeSessionOffsetForDueAt,
  hasProvisionalForecast,
  provisionalDueCandidates,
} from "../verification/provisional-intervals";
import type { AttemptModality, LearningItem } from "../verification/types";

export interface PlacementAdmissionInput {
  candidates: readonly LearningItem[];
  maxConversionsPerSession: number;
  forecast: CapacityForecast;
  estimatedSecondsByModality: Record<AttemptModality, number>;
  now: Date;
  activeSessionDates: readonly Date[];
}

export interface PlacementAdmissionResult {
  admitted: LearningItem[];
  deferred: LearningItem[];
  capacitySafeConversions: number;
  newReservations: CapacityReservation[];
  forecast: CapacityForecast;
  status: "ready" | "insufficient-forecast";
}

interface TrialReservation {
  forecast: CapacityForecast;
  reservations: CapacityReservation[];
  converted: LearningItem;
}

function alreadyReserved(
  forecast: CapacityForecast,
  itemId: string,
): boolean {
  return forecast.reservations.some((reservation) => reservation.itemId === itemId);
}

function placementReservation(
  wordId: string,
  skill: "listening" | "production",
  estimatedSeconds: number,
  deadlineSession: number,
): CapacityReservation {
  return {
    itemId: `${wordId}#${skill}`,
    source: "placement",
    skill,
    deadlineSession,
    estimatedSeconds,
  };
}

function reserveDerivedSkills(
  forecast: CapacityForecast,
  wordId: string,
  costs: Record<AttemptModality, number>,
): { forecast: CapacityForecast; reservations: CapacityReservation[] } | null {
  const reservations: CapacityReservation[] = [];
  let next = forecast;

  const listeningId = `${wordId}#listening`;
  let listeningDeadline = 0;
  if (!alreadyReserved(next, listeningId)) {
    const listening = reserveCapacity(
      next,
      placementReservation(wordId, "listening", costs.listening, 6),
    );
    if (!listening) return null;
    next = listening.forecast;
    reservations.push(listening.reservation);
    listeningDeadline = listening.reservation.deadlineSession;
  } else {
    listeningDeadline = next.reservations.find((item) => item.itemId === listeningId)
      ?.deadlineSession ?? 0;
  }

  const productionId = `${wordId}#production`;
  if (!alreadyReserved(next, productionId)) {
    const production = reserveCapacity(
      next,
      placementReservation(wordId, "production", costs.production, 7),
      listeningDeadline + 1,
    );
    if (!production) return null;
    next = production.forecast;
    reservations.push(production.reservation);
  }

  return { forecast: next, reservations };
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

function tryReserveConversion(
  forecast: CapacityForecast,
  item: LearningItem,
  costs: Record<AttemptModality, number>,
  now: Date,
  activeSessionDates: readonly Date[],
): TrialReservation | null {
  if (!item.placementInference || item.schedule.kind !== "none") return null;

  const derived = reserveDerivedSkills(forecast, item.wordId, costs);
  if (!derived) return null;

  const next = derived.forecast;
  const reservations = [...derived.reservations];

  for (const dueAt of provisionalDueCandidates("inference", item.id, now)) {
    const sessionOffset = activeSessionOffsetForDueAt(activeSessionDates, dueAt);
    if (sessionOffset === null) continue;

    if (sessionOffset > 8) {
      if (alreadyReserved(next, item.id)) {
        return { forecast: next, reservations, converted: toProvisional(item, dueAt) };
      }
      const beyond: CapacityReservation = {
        itemId: item.id,
        source: "placement",
        skill: "meaning",
        deadlineSession: sessionOffset,
        estimatedSeconds: costs.recognition,
      };
      return {
        forecast: {
          ...next,
          reservations: [...next.reservations, beyond],
        },
        reservations: [...reservations, beyond],
        converted: toProvisional(item, dueAt),
      };
    }

    if (alreadyReserved(next, item.id)) {
      return { forecast: next, reservations, converted: toProvisional(item, dueAt) };
    }

    const provisional = reserveCapacity(
      next,
      {
        itemId: item.id,
        source: "placement",
        skill: "meaning",
        deadlineSession: sessionOffset,
        estimatedSeconds: costs.recognition,
      },
      sessionOffset,
    );
    if (!provisional) continue;

    return {
      forecast: provisional.forecast,
      reservations: [...reservations, provisional.reservation],
      converted: toProvisional(item, dueAt),
    };
  }

  return null;
}

/**
 * Atomically admits placement conversions against the eight-session ledger.
 * Daily max is only a safety cap over capacity-safe conversions.
 * Candidate order is preserved (control samples → inferredAt → itemId).
 */
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
    forecast: input.forecast,
    status: "ready",
  };

  if (
    input.forecast.status !== "ready"
    || input.forecast.unreservedItemIds.length > 0
  ) {
    return empty;
  }

  if (!hasProvisionalForecast("inference", input.now, input.activeSessionDates)) {
    return { ...empty, status: "insufficient-forecast" };
  }

  let capacityForecast = input.forecast;
  let committedForecast = input.forecast;
  const admitted: LearningItem[] = [];
  const deferred: LearningItem[] = [];
  const newReservations: CapacityReservation[] = [];
  let capacitySafeConversions = 0;

  for (const candidate of input.candidates) {
    if (!candidate.placementInference || candidate.schedule.kind !== "none") {
      deferred.push(candidate);
      continue;
    }

    const trial = tryReserveConversion(
      capacityForecast,
      candidate,
      input.estimatedSecondsByModality,
      input.now,
      input.activeSessionDates,
    );
    if (!trial) {
      deferred.push(candidate);
      continue;
    }

    capacityForecast = trial.forecast;
    capacitySafeConversions += 1;
    if (admitted.length >= maxConversions) {
      deferred.push(candidate);
      continue;
    }

    committedForecast = trial.forecast;
    admitted.push(trial.converted);
    newReservations.push(...trial.reservations);
  }

  return {
    admitted,
    deferred,
    capacitySafeConversions,
    newReservations,
    forecast: committedForecast,
    status: "ready",
  };
}
