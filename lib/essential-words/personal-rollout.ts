import type { ShadowComparison } from "./shadow-metrics";

export interface PersonalRolloutPolicy {
  version: "personal-rollout-v1";
  minimumShadowSessions: number;
  maximumSkillErrors: number;
  requireZeroDoubleWrites: boolean;
  requireZeroOrphanSkillWrites: boolean;
  requireRollbackVerified: boolean;
}

export const PERSONAL_ROLLOUT_POLICY: PersonalRolloutPolicy = Object.freeze({
  version: "personal-rollout-v1",
  minimumShadowSessions: 10,
  maximumSkillErrors: 0,
  requireZeroDoubleWrites: true,
  requireZeroOrphanSkillWrites: true,
  requireRollbackVerified: true,
});

export interface PersonalRolloutIntegrityChecks {
  doubleWrites: number;
  orphanSkillWrites: number;
  rollbackVerified: boolean;
}

export type RolloutBlocker =
  | "insufficient_shadow_sessions"
  | "skill_compute_errors"
  | "double_write_detected"
  | "orphan_skill_write_detected"
  | "rollback_not_verified"
  | "invalid_metrics"
  | "pathological_queue_growth"
  | "pathological_estimated_time"
  | "persistent_deferred_mandatory"
  | "recovery_almost_always";

export type RolloutWarning =
  | "sink_errors_observed"
  | "queue_size_differs"
  | "estimated_time_differs"
  | "recovery_observed";

interface DistributionSummary {
  mean: number | null;
  p95: number | null;
}

interface DifferenceSummary {
  mean: number | null;
  maxAbsolute: number | null;
}

export interface PersonalRolloutSummary {
  shadowSessions: number;
  skillComputeErrors: number;
  sinkErrors: number;
  legacyQueueSize: DistributionSummary;
  skillQueueSize: DistributionSummary;
  queueSizeDifference: DifferenceSummary;
  legacyEstimatedSeconds: DistributionSummary;
  skillEstimatedSeconds: DistributionSummary;
  estimatedSecondsDifference: DifferenceSummary;
  recoverySessions: number;
  deferredMandatory: {
    mean: number | null;
    max: number | null;
  };
}

export interface PersonalRolloutGateResult {
  ready: boolean;
  policyVersion: PersonalRolloutPolicy["version"];
  blockers: RolloutBlocker[];
  warnings: RolloutWarning[];
  summary: PersonalRolloutSummary;
}

const isSinkError = (error: string): boolean => error.startsWith("metrics_sink:");

function mean(values: number[]): number | null {
  return values.length === 0
    ? null
    : values.reduce((total, value) => total + value, 0) / values.length;
}

function p95(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.ceil(sorted.length * 0.95) - 1];
}

const distribution = (values: number[]): DistributionSummary => ({
  mean: mean(values),
  p95: p95(values),
});

const difference = (values: number[]): DifferenceSummary => ({
  mean: mean(values),
  maxAbsolute: values.length === 0
    ? null
    : Math.max(...values.map((value) => Math.abs(value))),
});

function isFiniteNonNegative(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

function hasInvalidMetrics(comparison: ShadowComparison): boolean {
  const values = [
    comparison.legacy.queueSize,
    comparison.legacy.estimatedSeconds,
    comparison.legacy.dueCount,
    comparison.computeMs,
  ];
  if (comparison.skill) {
    values.push(
      comparison.skill.queueSize,
      comparison.skill.estimatedSeconds,
      comparison.skill.dueCount,
      comparison.skill.mandatorySelected,
      comparison.skill.deferredMandatory,
      comparison.skill.baseSkillActivations,
      comparison.skill.usageActivations,
    );
  }
  if (comparison.differences) {
    values.push(
      comparison.differences.queueSize,
      comparison.differences.estimatedSeconds,
      comparison.differences.dueCount,
    );
  }
  const mismatchedComparison = (comparison.skill === null)
    !== (comparison.differences === null);
  return Number.isNaN(Date.parse(comparison.occurredAt))
    || mismatchedComparison
    || values.some((value) => !Number.isFinite(value))
    || [
      comparison.legacy.queueSize,
      comparison.legacy.estimatedSeconds,
      comparison.legacy.dueCount,
      comparison.computeMs,
      ...(comparison.skill ? [
        comparison.skill.queueSize,
        comparison.skill.estimatedSeconds,
        comparison.skill.dueCount,
        comparison.skill.mandatorySelected,
        comparison.skill.deferredMandatory,
        comparison.skill.baseSkillActivations,
        comparison.skill.usageActivations,
      ] : []),
    ].some((value) => !isFiniteNonNegative(value));
}

function repeatedExtreme(
  comparisons: ShadowComparison[],
  predicate: (comparison: ShadowComparison & { skill: NonNullable<ShadowComparison["skill"]> }) => boolean,
): boolean {
  const comparable = comparisons.filter(
    (comparison): comparison is ShadowComparison & {
      skill: NonNullable<ShadowComparison["skill"]>;
    } => comparison.skill !== null,
  );
  const matches = comparable.filter(predicate).length;
  return matches >= 3 && matches / comparable.length >= 0.5;
}

function hasPersistentDeferredMandatory(comparisons: ShadowComparison[]): boolean {
  const values = comparisons.flatMap((comparison) =>
    comparison.skill ? [comparison.skill.deferredMandatory] : []);
  if (values.length < 5) return false;
  const tail = values.slice(-5);
  return tail[0] > 0
    && tail.every((value, index) => index === 0 || value >= tail[index - 1])
    && tail[tail.length - 1] >= tail[0] + 4;
}

export function summarizePersonalRollout(
  comparisons: ShadowComparison[],
): PersonalRolloutSummary {
  const skillComparisons = comparisons.filter(
    (comparison): comparison is ShadowComparison & {
      skill: NonNullable<ShadowComparison["skill"]>;
      differences: NonNullable<ShadowComparison["differences"]>;
    } => comparison.skill !== null && comparison.differences !== null,
  );
  const queueDifferences = skillComparisons.map(
    (comparison) => comparison.differences.queueSize,
  );
  const timeDifferences = skillComparisons.map(
    (comparison) => comparison.differences.estimatedSeconds,
  );
  const deferred = skillComparisons.map(
    (comparison) => comparison.skill.deferredMandatory,
  );

  return {
    shadowSessions: comparisons.length,
    skillComputeErrors: comparisons.reduce(
      (total, comparison) => total + comparison.errors.filter(
        (error) => !isSinkError(error),
      ).length,
      0,
    ),
    sinkErrors: comparisons.reduce(
      (total, comparison) => total + comparison.errors.filter(isSinkError).length,
      0,
    ),
    legacyQueueSize: distribution(comparisons.map((item) => item.legacy.queueSize)),
    skillQueueSize: distribution(skillComparisons.map((item) => item.skill.queueSize)),
    queueSizeDifference: difference(queueDifferences),
    legacyEstimatedSeconds: distribution(
      comparisons.map((item) => item.legacy.estimatedSeconds),
    ),
    skillEstimatedSeconds: distribution(
      skillComparisons.map((item) => item.skill.estimatedSeconds),
    ),
    estimatedSecondsDifference: difference(timeDifferences),
    recoverySessions: skillComparisons.filter(
      (comparison) => comparison.skill.mode === "recovery",
    ).length,
    deferredMandatory: {
      mean: mean(deferred),
      max: deferred.length === 0 ? null : Math.max(...deferred),
    },
  };
}

export function evaluatePersonalRolloutGate(
  comparisons: ShadowComparison[],
  integrity: PersonalRolloutIntegrityChecks,
  policy: PersonalRolloutPolicy = PERSONAL_ROLLOUT_POLICY,
): PersonalRolloutGateResult {
  const summary = summarizePersonalRollout(comparisons);
  const blockers: RolloutBlocker[] = [];
  const warnings: RolloutWarning[] = [];

  if (summary.shadowSessions < policy.minimumShadowSessions) {
    blockers.push("insufficient_shadow_sessions");
  }
  if (summary.skillComputeErrors > policy.maximumSkillErrors) {
    blockers.push("skill_compute_errors");
  }
  if (policy.requireZeroDoubleWrites && integrity.doubleWrites > 0) {
    blockers.push("double_write_detected");
  }
  if (policy.requireZeroOrphanSkillWrites && integrity.orphanSkillWrites > 0) {
    blockers.push("orphan_skill_write_detected");
  }
  if (policy.requireRollbackVerified && !integrity.rollbackVerified) {
    blockers.push("rollback_not_verified");
  }
  if (
    comparisons.some(hasInvalidMetrics)
    || !Number.isInteger(integrity.doubleWrites)
    || integrity.doubleWrites < 0
    || !Number.isInteger(integrity.orphanSkillWrites)
    || integrity.orphanSkillWrites < 0
  ) {
    blockers.push("invalid_metrics");
  }
  if (repeatedExtreme(comparisons, ({ legacy, skill }) =>
    skill.queueSize > Math.max(legacy.queueSize * 4, legacy.queueSize + 20))) {
    blockers.push("pathological_queue_growth");
  }
  if (repeatedExtreme(comparisons, ({ legacy, skill }) =>
    skill.estimatedSeconds > Math.max(legacy.estimatedSeconds * 4, legacy.estimatedSeconds + 900))) {
    blockers.push("pathological_estimated_time");
  }
  if (hasPersistentDeferredMandatory(comparisons)) {
    blockers.push("persistent_deferred_mandatory");
  }
  if (
    summary.shadowSessions >= policy.minimumShadowSessions
    && summary.recoverySessions / summary.shadowSessions >= 0.9
  ) {
    blockers.push("recovery_almost_always");
  }

  if (summary.sinkErrors > 0) warnings.push("sink_errors_observed");
  if (summary.queueSizeDifference.maxAbsolute !== null
    && summary.queueSizeDifference.maxAbsolute > 0) {
    warnings.push("queue_size_differs");
  }
  if (summary.estimatedSecondsDifference.maxAbsolute !== null
    && summary.estimatedSecondsDifference.maxAbsolute > 0) {
    warnings.push("estimated_time_differs");
  }
  if (summary.recoverySessions > 0) warnings.push("recovery_observed");

  return {
    ready: blockers.length === 0,
    policyVersion: policy.version,
    blockers,
    warnings,
    summary,
  };
}
