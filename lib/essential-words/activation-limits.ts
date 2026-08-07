import { DEFAULT_BASE_ACTIVATION_POLICY } from "./base-activation-allowance";
import type { ActivationLimits } from "./planning-types";

export const DEFAULT_ACTIVATION_LIMITS: ActivationLimits = {
  absoluteBaseActivationSafetyCeiling: DEFAULT_BASE_ACTIVATION_POLICY.absoluteSafetyCeiling,
  maxUsageActivationsPerSession: 1,
  maxPerItemPerSession: 1,
};

export function resolveAbsoluteBaseActivationSafetyCeiling(
  limits: ActivationLimits,
): number {
  return limits.absoluteBaseActivationSafetyCeiling
    ?? limits.maxBaseSkillActivationsPerSession
    ?? DEFAULT_BASE_ACTIVATION_POLICY.absoluteSafetyCeiling;
}
