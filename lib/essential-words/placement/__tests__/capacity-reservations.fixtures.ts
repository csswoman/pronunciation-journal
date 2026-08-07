import type {
  CapacityReservation,
  ForecastSessionCapacity,
} from "../../planning-types";
import type { LearningItem } from "../../verification/types";
import type { PlacementAdmissionInput } from "../../admission-control";
import { buildCapacityForecast } from "../../capacity-forecast";
import { DEFAULT_CONVERSIONS_PER_DAY } from "../policy";
import { admitPlacementConversions } from "../../admission-control";

export const costs = {
  recognition: 12,
  listening: 16,
  production: 22,
  pronunciation: 24,
};

export const NOW = new Date("2026-08-06T10:00:00.000Z");

export function openSessions(seconds = 100): ForecastSessionCapacity[] {
  return Array.from({ length: 8 }, (_, index) => ({
    sessionOffset: index + 1,
    availableSeconds: seconds,
    listeningSeconds: seconds,
    productionSeconds: seconds,
  }));
}

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

export function readyForecast(
  sessions: ForecastSessionCapacity[] = openSessions(),
  pendingBase: CapacityReservation[] = [],
  futureReservations: CapacityReservation[] = [],
) {
  return buildCapacityForecast({
    sessions,
    mandatory: [],
    pendingBase,
    futureReservations,
  });
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
    forecast: readyForecast(),
    estimatedSecondsByModality: costs,
    now: NOW,
    activeSessionDates: activeDates(),
    ...overrides,
  });
}

export function exactPairSessions(): ForecastSessionCapacity[] {
  return openSessions(0).map((session, index) => {
    if (index === 0) {
      return {
        ...session,
        availableSeconds: costs.listening,
        listeningSeconds: costs.listening,
        productionSeconds: 0,
      };
    }
    if (index === 1) {
      return {
        ...session,
        availableSeconds: costs.production,
        listeningSeconds: 0,
        productionSeconds: costs.production,
      };
    }
    return session;
  });
}
