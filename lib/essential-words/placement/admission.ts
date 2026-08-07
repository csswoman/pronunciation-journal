import {
  reserveCapacity,
  type CapacityForecast,
} from "../capacity-forecast";
import type { AdmissionLoadEnvelope } from "../admission-envelope";
import { applyExpectedFsrsReserve } from "../hard-mandatory-forecast";
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
  /**
   * Same envelope used by `admitNewWords` (Task 8.9k §1). Placement must
   * reserve against the same expected-FSRS-debt margin as new-word
   * admission — without it, placement can look "capacity-safe" against a
   * forecast that is more optimistic than the one gating new words.
   */
  admissionEnvelope?: AdmissionLoadEnvelope;
}

export interface PlacementAdmissionResult {
  admitted: LearningItem[];
  deferred: LearningItem[];
  capacitySafeConversions: number;
  newReservations: CapacityReservation[];
  forecast: CapacityForecast;
  status: "ready" | "insufficient-forecast";
  /** Candidate had no C9-safe slot for one of its required reservations. */
  rejectedForCapacity: number;
  /** Candidate was capacity-safe but `maxConversionsPerSession` was already reached. */
  rejectedForSafetyCeiling: number;
  /**
   * Defense-in-depth counter (Task 8.9k §5): a candidate individually fit,
   * but accepting it would have pushed an already-committed obligation (from
   * this same cohort) past its own C9 deadline. Expected to stay 0 given how
   * `reserveCapacity` only ever consumes leftover seconds — never rewrites an
   * existing reservation — but verified explicitly rather than assumed.
   */
  rejectedForAggregateC9: number;
}

/** Task 8.9k §4 — explicit per-candidate demand model, adapted to the real ledger types. */
export interface PlacementCapacityDemand {
  inferenceId: string;
  wordId: string;
  baseObligations: readonly {
    itemId: string;
    skill: "listening" | "production";
    deadlineSession: number;
    estimatedSeconds: number;
  }[];
  provisionalWork?: {
    itemId: string;
    deadlineSession: number;
    estimatedSeconds: number;
  };
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

/** Builds the explicit demand for a candidate before any reservation attempt (§4). */
export function buildPlacementCapacityDemand(
  item: LearningItem,
  costs: Record<AttemptModality, number>,
): PlacementCapacityDemand | null {
  if (!item.placementInference) return null;
  return {
    inferenceId: item.placementInference.bandId,
    wordId: item.wordId,
    baseObligations: [
      {
        itemId: `${item.wordId}#listening`,
        skill: "listening",
        deadlineSession: 6,
        estimatedSeconds: costs.listening,
      },
      {
        itemId: `${item.wordId}#production`,
        skill: "production",
        deadlineSession: 7,
        estimatedSeconds: costs.production,
      },
    ],
  };
}

function reserveDerivedSkills(
  forecast: CapacityForecast,
  demand: PlacementCapacityDemand,
): { forecast: CapacityForecast; reservations: CapacityReservation[] } | null {
  const reservations: CapacityReservation[] = [];
  let next = forecast;
  let listeningDeadline = 0;

  for (const obligation of demand.baseObligations) {
    if (alreadyReserved(next, obligation.itemId)) {
      if (obligation.skill === "listening") {
        listeningDeadline = next.reservations.find((item) => item.itemId === obligation.itemId)
          ?.deadlineSession ?? 0;
      }
      continue;
    }
    const earliest = obligation.skill === "production" ? listeningDeadline + 1 : 1;
    const reserved = reserveCapacity(
      next,
      placementReservation(
        demand.wordId,
        obligation.skill,
        obligation.estimatedSeconds,
        obligation.deadlineSession,
      ),
      earliest,
    );
    if (!reserved) return null;
    next = reserved.forecast;
    reservations.push(reserved.reservation);
    if (obligation.skill === "listening") listeningDeadline = reserved.reservation.deadlineSession;
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
  admissionEnvelope: AdmissionLoadEnvelope | undefined,
): TrialReservation | null {
  if (!item.placementInference || item.schedule.kind !== "none") return null;
  const demand = buildPlacementCapacityDemand(item, costs);
  if (!demand) return null;

  // Same margin/semantics as `admitNewWords`'s `reservePair` (Task 8.9k §1):
  // each candidate reserves against the same expected-FSRS-debt envelope,
  // computed fresh against the forecast already reduced by every previously
  // accepted candidate — so N accepted conversions stack N review-debt units.
  const baseForecast: CapacityForecast = admissionEnvelope
    ? {
        ...forecast,
        sessions: applyExpectedFsrsReserve(
          forecast.sessions,
          admissionEnvelope.expectedReviewSecondsBySession,
        ),
      }
    : forecast;

  const derived = reserveDerivedSkills(baseForecast, demand);
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

/** Task 8.9k §5 — every base reservation committed so far must still be <=8. */
function allCommittedWithinC9(forecast: CapacityForecast): boolean {
  return forecast.reservations
    .filter((reservation) => reservation.skill === "listening" || reservation.skill === "production")
    .every((reservation) => reservation.deadlineSession <= 8);
}

/**
 * Atomically admits placement conversions against the eight-session ledger,
 * evaluating the cohort *cumulatively* (Task 8.9k §2): each candidate is
 * tried against the forecast already reduced by every previously accepted
 * candidate in this same pass, never against the original snapshot.
 *
 * `maxConversionsPerSession` is only a safety ceiling layered on top of the
 * capacity-safe count (§6): `accepted = min(safetyCeiling,
 * capacitySafeConversions)`, never `accepted = safetyCeiling` while
 * candidates remain.
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
    rejectedForCapacity: 0,
    rejectedForSafetyCeiling: 0,
    rejectedForAggregateC9: 0,
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
  let rejectedForCapacity = 0;
  let rejectedForSafetyCeiling = 0;
  let rejectedForAggregateC9 = 0;

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
      input.admissionEnvelope,
    );
    if (!trial) {
      deferred.push(candidate);
      rejectedForCapacity += 1;
      continue;
    }

    // §5 — re-verify the *whole* committed-so-far cohort, not just this
    // candidate, before accepting it into the forecast used by everyone else.
    if (!allCommittedWithinC9(trial.forecast)) {
      deferred.push(candidate);
      rejectedForAggregateC9 += 1;
      continue;
    }

    capacityForecast = trial.forecast;
    capacitySafeConversions += 1;
    if (admitted.length >= maxConversions) {
      deferred.push(candidate);
      rejectedForSafetyCeiling += 1;
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
    rejectedForCapacity,
    rejectedForSafetyCeiling,
    rejectedForAggregateC9,
  };
}
