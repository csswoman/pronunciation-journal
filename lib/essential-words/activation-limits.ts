import { DEFAULT_BASE_ACTIVATION_POLICY } from "./base-activation-allowance";
import type { ActivationLimits } from "./planning-types";

export const DEFAULT_ACTIVATION_LIMITS: ActivationLimits = {
  absoluteBaseActivationSafetyCeiling: DEFAULT_BASE_ACTIVATION_POLICY.absoluteSafetyCeiling,
  maxUsageActivationsPerSession: 1,
  usageActivationWindowSessions: 7,
  maxUsageActivationsPerWindow: 3,
  maxPerItemPerSession: 1,
};

export const USAGE_ACTIVATION_POLICY_VERSION = "usage-activation-v1";

/**
 * New usage is deliberately introduced at a rolling cadence. Existing usage
 * reviews remain mandatory and do not participate in this activation gate.
 */
export function usageActivationLimitForSession(
  recentUsageActivations: readonly number[],
  limits: ActivationLimits,
): number {
  const window = Math.max(1, limits.usageActivationWindowSessions ?? 1);
  const maximumInWindow = Math.max(
    0,
    limits.maxUsageActivationsPerWindow ?? limits.maxUsageActivationsPerSession,
  );
  const priorSessions = window === 1
    ? []
    : recentUsageActivations.slice(-(window - 1));
  const alreadyActivated = priorSessions
    .reduce((total, count) => total + Math.max(0, count), 0);
  return Math.min(
    Math.max(0, limits.maxUsageActivationsPerSession),
    Math.max(0, maximumInWindow - alreadyActivated),
  );
}

export function resolveAbsoluteBaseActivationSafetyCeiling(
  limits: ActivationLimits,
): number {
  return limits.absoluteBaseActivationSafetyCeiling
    ?? limits.maxBaseSkillActivationsPerSession
    ?? DEFAULT_BASE_ACTIVATION_POLICY.absoluteSafetyCeiling;
}
