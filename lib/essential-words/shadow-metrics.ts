import type { DailyPlan } from "./planning-types";

export interface LegacyShadowMetrics {
  queueSize: number;
  estimatedSeconds: number;
  dueCount: number;
}

export interface SkillShadowMetrics {
  queueSize: number;
  estimatedSeconds: number;
  dueCount: number;
  mandatorySelected: number;
  deferredMandatory: number;
  baseSkillActivations: number;
  usageActivations: number;
  mode: "normal" | "recovery";
}

export interface ShadowComparison {
  occurredAt: string;
  legacy: LegacyShadowMetrics;
  skill: SkillShadowMetrics | null;
  differences: {
    queueSize: number;
    estimatedSeconds: number;
    dueCount: number;
  } | null;
  computeMs: number;
  errors: string[];
}

export interface ShadowMetricsSink {
  record(comparison: ShadowComparison): Promise<void> | void;
}

export function summarizeSkillDailyPlan(plan: DailyPlan): SkillShadowMetrics {
  return {
    queueSize: plan.mandatorySelected.length
      + plan.baseSkillSelected.length
      + plan.usageSelected.length
      + plan.newWordsSelected.length
      + plan.placementSelected.length,
    estimatedSeconds: plan.allowance.plannedSeconds,
    dueCount: plan.mandatorySelected.length + plan.deferredMandatory.length,
    mandatorySelected: plan.mandatorySelected.length,
    deferredMandatory: plan.deferredMandatory.length,
    baseSkillActivations: plan.allowance.baseSkillActivations,
    usageActivations: plan.allowance.usageActivations,
    mode: plan.allowance.mode,
  };
}

export function compareShadowMetrics(
  occurredAt: string,
  legacy: LegacyShadowMetrics,
  skill: SkillShadowMetrics | null,
  computeMs: number,
  errors: string[] = [],
): ShadowComparison {
  return {
    occurredAt,
    legacy,
    skill,
    differences: skill ? {
      queueSize: skill.queueSize - legacy.queueSize,
      estimatedSeconds: skill.estimatedSeconds - legacy.estimatedSeconds,
      dueCount: skill.dueCount - legacy.dueCount,
    } : null,
    computeMs: Math.max(0, computeMs),
    errors: [...errors],
  };
}

export function normalizeShadowError(error: unknown): string {
  const rawName = error instanceof Error ? error.name : "Error";
  const name = ["Error", "TypeError", "RangeError", "TimeoutError"].includes(rawName)
    ? rawName
    : "Error";
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  const category = message.includes("mapping")
    ? "mapping_failed"
    : message.includes("migration")
      ? "migration_failed"
      : message.includes("reconstruct")
        ? "reconstruction_failed"
        : message.includes("timeout")
          ? "timeout"
          : "skill_compute_failed";
  return `${name}:${category}`;
}

/** Small inspection sink for a personal deployment; no persistence or retries. */
export class InMemoryShadowMetricsSink implements ShadowMetricsSink {
  readonly comparisons: ShadowComparison[] = [];

  record(comparison: ShadowComparison): void {
    this.comparisons.push(comparison);
  }
}
