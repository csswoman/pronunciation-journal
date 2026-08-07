import {
  assertNoNegativeReservations,
  dedupeCapacityWork,
  type CapacityWorkItem,
} from "./capacity-work";
import type { ForecastSessionCapacity } from "./planning-types";

export interface FutureCapacitySlot {
  sessionOffset: number;
  totalSeconds: number;
  committedMandatorySeconds: number;
  committedBaseSeconds: number;
  committedPlacementSeconds: number;
  expectedFsrsReserveSeconds: number;
  residualSeconds: number;
}

function cloneSessions(
  sessions: readonly ForecastSessionCapacity[],
): ForecastSessionCapacity[] {
  return sessions.map((session) => ({ ...session }));
}

/**
 * Places mandatory work earliest-first with rollover when a slot is full.
 * Deduplicates by itemId; never creates negative capacity.
 */
export function applyMandatoryWithRollover(
  sessions: readonly ForecastSessionCapacity[],
  demands: readonly CapacityWorkItem[],
): CapacityWorkItem[] {
  const ordered = dedupeCapacityWork(demands)
    .sort((left, right) => (
      left.sessionOffset - right.sessionOffset
      || left.itemId.localeCompare(right.itemId)
    ));
  const remaining = cloneSessions(sessions)
    .sort((left, right) => left.sessionOffset - right.sessionOffset);
  const placed: CapacityWorkItem[] = [];

  for (const demand of ordered) {
    let sessionIndex = remaining.findIndex((session) => (
      session.sessionOffset >= demand.sessionOffset
    ));
    if (sessionIndex < 0) sessionIndex = 0;

    let placedOffset: number | null = null;
    for (let index = sessionIndex; index < remaining.length; index += 1) {
      const session = remaining[index];
      if (session.availableSeconds >= demand.estimatedSeconds) {
        session.availableSeconds -= demand.estimatedSeconds;
        session.listeningSeconds = Math.min(
          session.listeningSeconds,
          session.availableSeconds,
        );
        session.productionSeconds = Math.min(
          session.productionSeconds,
          session.availableSeconds,
        );
        placedOffset = session.sessionOffset;
        break;
      }
    }
    if (placedOffset !== null) {
      placed.push({ ...demand, sessionOffset: placedOffset });
    }
  }

  assertNoNegativeReservations(placed);
  return placed;
}

export function buildFutureCapacitySlots(input: {
  sessions: readonly ForecastSessionCapacity[];
  mandatory: readonly CapacityWorkItem[];
  base: readonly CapacityWorkItem[];
  placement: readonly CapacityWorkItem[];
  expectedFsrsBySession: readonly number[];
}): FutureCapacitySlot[] {
  const sessions = [...input.sessions]
    .sort((left, right) => left.sessionOffset - right.sessionOffset);
  const mandatory = applyMandatoryWithRollover(sessions, input.mandatory);
  const combined = dedupeCapacityWork([
    ...mandatory,
    ...input.base,
    ...input.placement,
  ]);

  return sessions.map((session, index) => {
    const totalSeconds = Math.max(
      session.availableSeconds,
      session.listeningSeconds,
      session.productionSeconds,
    );
    // Rebuild from original totals: callers pass residual sessions OR full.
    // Prefer explicit total via max of the three lanes at input time.
    const originalTotal = totalSeconds;
    let committedMandatorySeconds = 0;
    let committedBaseSeconds = 0;
    let committedPlacementSeconds = 0;
    for (const item of combined) {
      if (item.sessionOffset !== session.sessionOffset) continue;
      if (item.workKind === "scheduled-review" || item.workKind === "learning-step") {
        committedMandatorySeconds += item.estimatedSeconds;
      } else if (item.workKind === "pending-base") {
        committedBaseSeconds += item.estimatedSeconds;
      } else if (item.workKind === "placement") {
        committedPlacementSeconds += item.estimatedSeconds;
      }
    }
    const expectedFsrsReserveSeconds = Math.max(
      0,
      input.expectedFsrsBySession[index] ?? 0,
    );
    const committed = committedMandatorySeconds
      + committedBaseSeconds
      + committedPlacementSeconds
      + expectedFsrsReserveSeconds;
    return {
      sessionOffset: session.sessionOffset,
      totalSeconds: originalTotal,
      committedMandatorySeconds,
      committedBaseSeconds,
      committedPlacementSeconds,
      expectedFsrsReserveSeconds,
      residualSeconds: originalTotal - committed,
    };
  });
}

export function reconcileCapacityLedger(slots: readonly FutureCapacitySlot[]): {
  ok: boolean;
  detail: string;
} {
  for (const slot of slots) {
    if (
      slot.totalSeconds < 0
      || slot.committedMandatorySeconds < 0
      || slot.committedBaseSeconds < 0
      || slot.committedPlacementSeconds < 0
      || slot.expectedFsrsReserveSeconds < 0
    ) {
      return { ok: false, detail: `negative seconds at session ${slot.sessionOffset}` };
    }
    const sum = slot.committedMandatorySeconds
      + slot.committedBaseSeconds
      + slot.committedPlacementSeconds
      + slot.expectedFsrsReserveSeconds
      + slot.residualSeconds;
    if (sum > slot.totalSeconds + 1e-6) {
      return {
        ok: false,
        detail: `overcommitted session ${slot.sessionOffset}: ${sum} > ${slot.totalSeconds}`,
      };
    }
  }
  return { ok: true, detail: "reconciled" };
}

/**
 * Deducts expected FSRS envelope seconds from forecast session residuals
 * so admission cannot spend capacity already claimed by future reviews.
 */
export function applyExpectedFsrsReserve(
  sessions: readonly ForecastSessionCapacity[],
  expectedFsrsBySession: readonly number[],
): ForecastSessionCapacity[] {
  return sessions.map((session, index) => {
    const reserve = Math.max(0, expectedFsrsBySession[index] ?? 0);
    const availableSeconds = Math.max(0, session.availableSeconds - reserve);
    return {
      ...session,
      availableSeconds,
      listeningSeconds: Math.min(session.listeningSeconds, availableSeconds),
      productionSeconds: Math.min(session.productionSeconds, availableSeconds),
    };
  });
}
