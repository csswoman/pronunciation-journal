import { estimateItemsSeconds } from "./cost-estimate";
import type { DailyPlanningInput } from "./planning-types";
import type { AttemptModality } from "./verification/types";

export interface RecoveryPolicy {
  enterAtBacklogBudgetRatio: number;
  exitAtBacklogBudgetRatio: number;
}

/** Provisional policy; phase 8 calibrates the band from production evidence. */
export const DEFAULT_RECOVERY_POLICY: RecoveryPolicy = {
  enterAtBacklogBudgetRatio: 2.0,
  exitAtBacklogBudgetRatio: 0.75,
};

/**
 * Accumulated debt in estimated seconds. Due-today items are ordinary daily
 * load, while overdue FSRS, provisional, and learning items are backlog.
 */
export function backlogSeconds(
  mandatory: DailyPlanningInput["mandatory"],
  byModality: Record<AttemptModality, number>,
): number {
  return estimateItemsSeconds(
    [...mandatory.learning, ...mandatory.overdue, ...mandatory.provisionalDue],
    byModality,
  );
}

export function resolveMode(
  backlog: number,
  dailyBudgetSeconds: number,
  previousMode: "normal" | "recovery" | undefined,
  policy: RecoveryPolicy,
): "normal" | "recovery" {
  const enterAt = dailyBudgetSeconds * policy.enterAtBacklogBudgetRatio;
  const exitAt = dailyBudgetSeconds * policy.exitAtBacklogBudgetRatio;

  if (backlog > enterAt) return "recovery";
  if (backlog < exitAt) return "normal";
  return previousMode ?? "normal";
}
