import type { CapacityForecast } from "./capacity-forecast";
import type { AttemptModality } from "./verification/types";

/**
 * Structural admission throughput (Task 8.9).
 * Residual forecast capacity for placement / new words is capped by the
 * session activation limit so the ledger cannot promise more base-skill work
 * than the planner can serve within the C9 horizon of eight active sessions.
 */
export const DEFAULT_ADMISSION_CAPACITY_POLICY = {
  version: "admission-capacity-v1",
  /**
   * Throughput used when reserving NEW words only.
   * Kept at or below the session base-activation limit so admissions cannot
   * outrun the planner inside the eight-session C9 horizon.
   */
  maxBaseActivationsPerSession: 4,
} as const;

/**
 * Caps residual listening/production lanes so admission cannot reserve more
 * work than `maxBaseActivationsPerSession` can serve per forecast slot.
 */
export function applyAdmissionThroughputCap(
  forecast: CapacityForecast,
  maxBaseActivationsPerSession: number,
  costs: Record<AttemptModality, number>,
): CapacityForecast {
  if (forecast.status !== "ready") return forecast;
  const activations = Math.max(0, Math.floor(maxBaseActivationsPerSession));
  if (activations === 0) {
    return {
      ...forecast,
      sessions: forecast.sessions.map((session) => ({
        ...session,
        availableSeconds: 0,
        listeningSeconds: 0,
        productionSeconds: 0,
      })),
    };
  }

  const listeningSlot = activations * costs.listening;
  const productionSlot = activations * costs.production;
  const sharedSlot = activations * Math.max(costs.listening, costs.production);

  return {
    ...forecast,
    sessions: forecast.sessions.map((session) => {
      const availableSeconds = Math.max(
        0,
        Math.min(session.availableSeconds, sharedSlot),
      );
      return {
        ...session,
        availableSeconds,
        listeningSeconds: Math.max(
          0,
          Math.min(session.listeningSeconds, listeningSlot, availableSeconds),
        ),
        productionSeconds: Math.max(
          0,
          Math.min(session.productionSeconds, productionSlot, availableSeconds),
        ),
      };
    }),
  };
}
