import { C9_BASE_ACTIVATION_LIMIT } from "./pending-base-fairness";
import type { AttemptModality } from "./verification/types";

export const BASE_BACKPRESSURE_POLICY_VERSION = "base-throughput-backpressure-v1";
export const BASE_BACKPRESSURE_WINDOW_SESSIONS = C9_BASE_ACTIVATION_LIMIT;

export interface BaseServiceSample {
  servedBaseActivations: number;
  serviceOpportunity: boolean;
}

export interface BaseBackpressure {
  pendingBaseCount: number;
  recentServiceRate: number;
  serviceCapacityWithinC9: number;
  availableObligationCapacity: number;
  status: "open" | "constrained" | "closed";
}

function startupServiceRate(input: {
  remainingSecondsAfterMandatory: number;
  modalityCosts: Record<AttemptModality, number>;
}): number {
  const averageBaseCost = (
    input.modalityCosts.listening + input.modalityCosts.production
  ) / 2;
  return averageBaseCost > 0
    ? Math.floor(Math.max(0, input.remainingSecondsAfterMandatory) / averageBaseCost)
    : 0;
}

/**
 * Compares current L/P debt with recently realized drainage. No future slots,
 * due dates, reservations, or profile rules participate in this decision.
 */
export function deriveBaseBackpressure(input: {
  pendingBaseCount: number;
  recentService: readonly BaseServiceSample[];
  remainingSecondsAfterMandatory: number;
  modalityCosts: Record<AttemptModality, number>;
}): BaseBackpressure {
  const pendingBaseCount = Math.max(0, Math.floor(input.pendingBaseCount));
  const recent = input.recentService.slice(-BASE_BACKPRESSURE_WINDOW_SESSIONS);
  const opportunities = recent.filter((sample) => sample.serviceOpportunity);
  const useStartupFallback = recent.length === 0
    || (pendingBaseCount === 0 && opportunities.length === 0);
  const recentServiceRate = useStartupFallback
    ? startupServiceRate(input)
    : opportunities.length === 0
      ? 0
      : opportunities.reduce(
          (total, sample) => total + Math.max(0, sample.servedBaseActivations),
          0,
        ) / opportunities.length;
  const serviceCapacityWithinC9 = recentServiceRate * C9_BASE_ACTIVATION_LIMIT;
  const availableObligationCapacity = Math.max(
    0,
    serviceCapacityWithinC9 - pendingBaseCount,
  );
  const status = availableObligationCapacity <= 0
    ? "closed"
    : pendingBaseCount === 0
      ? "open"
      : "constrained";

  return {
    pendingBaseCount,
    recentServiceRate,
    serviceCapacityWithinC9,
    availableObligationCapacity,
    status,
  };
}

export function consumeBaseObligationCapacity(
  backpressure: BaseBackpressure,
  obligations: number,
): BaseBackpressure {
  const availableObligationCapacity = Math.max(
    0,
    backpressure.availableObligationCapacity - Math.max(0, Math.floor(obligations)),
  );
  return {
    ...backpressure,
    availableObligationCapacity,
    status: availableObligationCapacity <= 0
      ? "closed"
      : backpressure.pendingBaseCount === 0
        ? "open"
        : "constrained",
  };
}
