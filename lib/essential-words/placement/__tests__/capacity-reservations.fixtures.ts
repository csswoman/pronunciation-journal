import type { CapacityReservation } from "../../planning-types";
import type { LearningItem } from "../../verification/types";
import type { PlacementAdmissionInput } from "../../admission-control";
import { deriveBaseBacklogPolicy } from "../../pending-base-fairness";
import { DEFAULT_CONVERSIONS_PER_DAY } from "../policy";
import { admitPlacementConversions } from "../../admission-control";

export const costs = {
  recognition: 12,
  listening: 16,
  production: 22,
  pronunciation: 24,
};

export const NOW = new Date("2026-08-06T10:00:00.000Z");

export const DEFAULT_BACKLOG_POLICY = deriveBaseBacklogPolicy({
  dailyBudgetSeconds: 900,
  modalityCosts: costs,
});

export function inferred(count: number, offset = 0): LearningItem[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `c1k:w${offset + index}#meaning`,
    wordId: `c1k:w${offset + index}`,
    skill: "meaning" as const,
    contentOrigin: "authored" as const,
    schedule: { kind: "none" as const },
    placementInference: {
      bandId: "band-1",
      confidence: 0.9,
      inferredAt: "2026-08-01T00:00:00.000Z",
      policyVersion: "band-v1",
    },
    repetitions: 0,
    lapses: 0,
    suspended: false,
  }));
}

export function activeDates(count = 30): Date[] {
  return Array.from({ length: count }, (_, index) => (
    new Date(NOW.getTime() + (index + 1) * 86_400_000)
  ));
}

export function admit(overrides: Partial<PlacementAdmissionInput> = {}) {
  return admitPlacementConversions({
    candidates: inferred(5),
    maxConversionsPerSession: DEFAULT_CONVERSIONS_PER_DAY,
    remainingSeconds: 900,
    perConversionSeconds: costs.recognition,
    estimatedSecondsByModality: costs,
    pendingBaseBacklogSeconds: 0,
    backlogPolicy: DEFAULT_BACKLOG_POLICY,
    now: NOW,
    activeSessionDates: activeDates(),
    ...overrides,
  });
}

/** Kept for tests that still build a pending-base reservation list directly. */
export function pendingBaseReservation(
  itemId: string,
  skill: "listening" | "production",
  estimatedSeconds: number,
): CapacityReservation {
  return {
    itemId,
    source: "pending-base",
    skill,
    deadlineSession: 8,
    estimatedSeconds,
  };
}
