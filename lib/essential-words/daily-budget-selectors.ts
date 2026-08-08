import {
  rankPendingBaseCandidates,
  toPendingBaseCandidate,
} from "./pending-base-fairness";
import type {
  ActivationCandidate,
  ActivationSelection,
  CapacityReservation,
  DailyPlanningInput,
  PlannedItem,
} from "./planning-types";
import type { AttemptModality } from "./verification/types";

/**
 * Selection helpers factored out of daily-budget.ts to keep that file under
 * the repo's 250-line convention (CLAUDE.md). Pure functions only — no
 * admission/backpressure policy lives here, just deterministic ordering and
 * greedy packing against a seconds budget.
 */

export interface MandatorySelection {
  selected: PlannedItem[];
  deferred: PlannedItem[];
  seconds: number;
}

function urgencyOrder(left: PlannedItem, right: PlannedItem): number {
  const leftRetrievability = left.retrievability ?? 1;
  const rightRetrievability = right.retrievability ?? 1;
  if (leftRetrievability !== rightRetrievability) {
    return leftRetrievability - rightRetrievability;
  }
  return left.dueAt.localeCompare(right.dueAt);
}

function deduplicateItems<T extends { itemId: string }>(items: T[]): T[] {
  const seenItemIds = new Set<string>();
  return items.filter((item) => {
    if (seenItemIds.has(item.itemId)) return false;
    seenItemIds.add(item.itemId);
    return true;
  });
}

function orderMandatory(mandatory: DailyPlanningInput["mandatory"]): PlannedItem[] {
  return deduplicateItems([
    ...[...mandatory.learning].sort(urgencyOrder),
    ...[...mandatory.overdue, ...mandatory.provisionalDue].sort(urgencyOrder),
    ...[...mandatory.dueToday].sort(urgencyOrder),
  ]);
}

export function selectMandatory(
  mandatory: DailyPlanningInput["mandatory"],
  budgetSeconds: number,
  byModality: Record<AttemptModality, number>,
): MandatorySelection {
  const ordered = orderMandatory(mandatory);
  const selected: PlannedItem[] = [];
  const deferred: PlannedItem[] = [];
  let seconds = 0;

  for (let index = 0; index < ordered.length; index += 1) {
    const item = ordered[index];
    const cost = byModality[item.modality];
    if (selected.length > 0 && seconds + cost > budgetSeconds) {
      deferred.push(...ordered.slice(index));
      break;
    }
    selected.push(item);
    seconds += cost;
  }

  return { selected, deferred, seconds };
}

export function selectActivations(
  candidates: ActivationCandidate[],
  maximum: number,
  availableSeconds: number,
  byModality: Record<AttemptModality, number>,
  selectedItemIds: Set<string>,
  maxPerItemPerSession: number,
): ActivationSelection {
  const selected: ActivationCandidate[] = [];
  const deferred: ActivationCandidate[] = [];
  let seconds = 0;

  for (let index = 0; index < candidates.length; index += 1) {
    const candidate = candidates[index];
    const cost = byModality[candidate.modality];
    if (selected.length >= maximum || selectedItemIds.has(candidate.itemId)) {
      deferred.push(candidate);
      continue;
    }
    if (maxPerItemPerSession < 1 || seconds + cost > availableSeconds) {
      deferred.push(...candidates.slice(index));
      break;
    }
    selected.push(candidate);
    selectedItemIds.add(candidate.itemId);
    seconds += cost;
  }

  return { selected, deferred, seconds };
}

export function placementIdSet(input: DailyPlanningInput): Set<string> {
  return new Set(
    [
      ...input.capacityForecast.dueReservations,
      ...input.capacityForecast.futureReservations,
    ]
      .filter((reservation) => reservation.source === "placement")
      .map((reservation) => reservation.itemId),
  );
}

/**
 * Orders pending-base candidates with C9 fairness (Task 8.9c, preserved
 * unchanged by the Fase 8 final simplification — only the admission gate
 * downstream of this ranking changed, not the ranking itself).
 */
export function orderDueFirst(
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

/** Flat rollover — no per-session packing, append-only outside completion. */
export function rolloverReservations(
  input: DailyPlanningInput,
  newReservations: CapacityReservation[],
): CapacityReservation[] {
  const byKey = new Map<string, CapacityReservation>();
  for (const reservation of [
    ...input.capacityForecast.dueReservations,
    ...input.capacityForecast.futureReservations,
    ...newReservations,
  ]) {
    byKey.set(`${reservation.itemId}:${reservation.skill}`, reservation);
  }
  return [...byKey.values()];
}
