import type { Skill } from "./verification/types";

export type CapacityWorkKind =
  | "scheduled-review"
  | "learning-step"
  | "pending-base"
  | "placement"
  | "admission-future-review";

export interface CapacityWorkItem {
  itemId: string;
  workKind: CapacityWorkKind;
  skill: Skill;
  estimatedSeconds: number;
  sessionOffset: number;
}

/** Hard scheduled work outranks probabilistic admission debt for the same item. */
const WORK_KIND_PRIORITY: Record<CapacityWorkKind, number> = {
  "scheduled-review": 0,
  "learning-step": 1,
  "pending-base": 2,
  placement: 3,
  "admission-future-review": 4,
};

export function capacityWorkKey(item: Pick<CapacityWorkItem, "itemId" | "workKind">): string {
  return `${item.itemId}:${item.workKind}`;
}

/**
 * Deduplicates by itemId across kinds that represent the same obligation.
 * scheduled-review / learning-step win over admission-future-review.
 * Same kind keeps the earliest sessionOffset.
 */
export function dedupeCapacityWork(
  items: readonly CapacityWorkItem[],
): CapacityWorkItem[] {
  const byItem = new Map<string, CapacityWorkItem>();
  for (const item of items) {
    if (!Number.isFinite(item.estimatedSeconds) || item.estimatedSeconds < 0) {
      throw new RangeError(`capacity work has negative or invalid seconds: ${item.itemId}`);
    }
    const existing = byItem.get(item.itemId);
    if (!existing) {
      byItem.set(item.itemId, item);
      continue;
    }
    const existingPriority = WORK_KIND_PRIORITY[existing.workKind];
    const nextPriority = WORK_KIND_PRIORITY[item.workKind];
    if (nextPriority < existingPriority) {
      byItem.set(item.itemId, item);
      continue;
    }
    if (
      nextPriority === existingPriority
      && item.sessionOffset < existing.sessionOffset
    ) {
      byItem.set(item.itemId, item);
    }
  }
  return [...byItem.values()].sort((left, right) => (
    left.sessionOffset - right.sessionOffset
    || left.itemId.localeCompare(right.itemId)
  ));
}

export function assertNoNegativeReservations(items: readonly CapacityWorkItem[]): void {
  for (const item of items) {
    if (!Number.isFinite(item.estimatedSeconds) || item.estimatedSeconds < 0) {
      throw new RangeError(`negative capacity reservation seconds for ${item.itemId}`);
    }
  }
}

export function assertNoDuplicateOwnership(items: readonly CapacityWorkItem[]): void {
  const seen = new Set<string>();
  for (const item of dedupeCapacityWork(items)) {
    const key = capacityWorkKey(item);
    if (seen.has(item.itemId)) {
      throw new Error(`duplicate capacity ownership for ${item.itemId} (${key})`);
    }
    seen.add(item.itemId);
  }
}
