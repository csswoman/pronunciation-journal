import {
  DEFAULT_BASE_ACTIVATION_POLICY,
  selectPendingBaseWithDynamicAllowance,
} from "./base-activation-allowance";
import type { CapacityForecast } from "./capacity-forecast";
import { resolveAbsoluteBaseActivationSafetyCeiling } from "./activation-limits";
import type {
  ActivationCandidate,
  ActivationLimits,
  ActivationSelection,
  DailyPlanningInput,
} from "./planning-types";

export function serviceForecastFromInput(input: DailyPlanningInput): CapacityForecast {
  return {
    status: "ready",
    sessions: input.capacityForecast.sessions.map((session) => ({ ...session })),
    reservations: [
      ...input.capacityForecast.dueReservations,
      ...input.capacityForecast.futureReservations,
    ],
    unreservedItemIds: [],
  };
}

export function selectBaseDynamically(
  input: DailyPlanningInput,
  limits: ActivationLimits,
  orderedBase: ActivationCandidate[],
  residualSeconds: number,
  selectedItemIds: Set<string>,
  recoveryMode: boolean,
): ActivationSelection {
  const dueBaseCount = orderedBase.filter((candidate) => (
    input.capacityForecast.dueReservations.some((reservation) => (
      reservation.itemId === candidate.itemId
    ))
  )).length;
  const safetyCeiling = Math.max(
    0,
    resolveAbsoluteBaseActivationSafetyCeiling(limits) - input.consumed.baseSkillActivations,
  );
  const result = selectPendingBaseWithDynamicAllowance({
    pendingBase: orderedBase,
    residualSecondsToday: residualSeconds,
    futureCapacity: serviceForecastFromInput(input),
    modalityCosts: input.estimatedSeconds.byModality,
    mandatoryDueBaseCount: dueBaseCount,
    recoveryMode,
    policy: {
      ...DEFAULT_BASE_ACTIVATION_POLICY,
      absoluteSafetyCeiling: Math.max(dueBaseCount, safetyCeiling),
    },
    selectedItemIds,
    maxPerItemPerSession: Math.min(1, Math.max(0, limits.maxPerItemPerSession)),
  });
  return {
    selected: result.selected,
    deferred: result.deferred,
    seconds: result.seconds,
    dynamicBaseAllowanceMax: result.allowance.maxActivationsToday,
    dynamicBaseLimitingFactor: result.allowance.limitingFactor,
  };
}
