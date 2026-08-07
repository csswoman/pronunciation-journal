import type { DailyPlan } from "../planning-types";
import {
  backlogStable,
  baseSkillActivationLiveness,
  budgetRespected,
  newWordLiveness,
  noOverdueStarvation,
  noSynchronizedPeaks,
  percentile95WithinBudget,
  recoveryExits,
  recoveryReturnSessions,
  retentionCalibrationWithinExpected,
  usageActivationShare,
} from "./criteria";
import type { SimulationProfile } from "./profiles";
import {
  runSimulation,
  SIMULATION_COSTS,
  type SimulationHarnessHooks,
  type SimulationResult,
} from "./run-simulation";
import type { SimulationOptions } from "./state";

export type SimulationMutation =
  | "never-listening"
  | "never-production"
  | "never-usage"
  | "zero-new-words"
  | "ignore-placement"
  | "duplicate-base-activations"
  | "starve-overdue"
  | "show-entire-recovery-backlog"
  | "synchronize-provisionals"
  | "low-retention"
  | "perfect-retention";

function removeItem(plan: DailyPlan, itemId: string): DailyPlan {
  const removed = plan.mandatorySelected.find((item) => item.itemId === itemId);
  if (!removed) return plan;
  return {
    ...plan,
    mandatorySelected: plan.mandatorySelected.filter((item) => item.itemId !== itemId),
    deferredMandatory: [removed, ...plan.deferredMandatory],
    allowance: {
      ...plan.allowance,
      plannedSeconds: Math.max(
        0,
        plan.allowance.plannedSeconds - SIMULATION_COSTS[removed.modality],
      ),
    },
  };
}

function hooksForMutation(mutation: SimulationMutation): SimulationHarnessHooks {
  let starvedItemId: string | undefined;
  const hooks: SimulationHarnessHooks = { allowTrivialDynamics: true };

  if (mutation === "never-listening" || mutation === "never-production") {
    const blockedSkill = mutation === "never-listening" ? "listening" : "production";
    hooks.mutateCandidates = (candidates) => ({
      ...candidates,
      baseSkillActivations: candidates.baseSkillActivations
        .filter((item) => item.skill !== blockedSkill),
    });
  } else if (mutation === "never-usage") {
    hooks.mutateCandidates = (candidates) => ({
      ...candidates,
      usageActivations: [],
    });
  } else if (mutation === "zero-new-words") {
    // Task 8.9i (Decisión 1): vaciar los candidatos ANTES del forecast (la
    // implementación anterior) hace que `capacitySafeNewWords` sea
    // legítimamente 0 bajo la nueva semántica capacity-conditioned — deja de
    // ser una violación (ver decision record 8.9h/8.9i). El adversarial
    // correcto para "hay capacidad real, pero se suprime la admisión"
    // preserva los candidatos (el forecast ve capacidad genuina) y solo
    // vacía lo efectivamente seleccionado, forzando starvation real.
    hooks.mutatePlan = (plan) => (
      plan.newWordsSelected.length > 0 ? { ...plan, newWordsSelected: [] } : plan
    );
  } else if (mutation === "ignore-placement") {
    hooks.mutateCandidates = (candidates) => ({
      ...candidates,
      placementCandidates: [],
      inferredConversions: [],
      conversionLimit: 0,
    });
  } else if (mutation === "duplicate-base-activations") {
    hooks.mutatePlan = (plan) => {
      if (plan.baseSkillSelected.length === 0) return plan;
      const copies = Array.from({ length: 30 }, () => plan.baseSkillSelected).flat();
      const copiedSeconds = copies.reduce(
        (total, item) => total + SIMULATION_COSTS[item.modality],
        0,
      );
      return {
        ...plan,
        baseSkillSelected: [...plan.baseSkillSelected, ...copies],
        allowance: {
          ...plan.allowance,
          baseSkillActivations: plan.allowance.baseSkillActivations + copies.length,
          totalSkillActivations: plan.allowance.totalSkillActivations + copies.length,
          plannedSeconds: plan.allowance.plannedSeconds + copiedSeconds,
        },
      };
    };
  } else if (mutation === "starve-overdue") {
    hooks.mutatePlan = (plan, mandatory) => {
      const allDue = [
        ...mandatory.learning,
        ...mandatory.overdue,
        ...mandatory.provisionalDue,
      ];
      if (!starvedItemId) {
        starvedItemId = allDue.find((item) => item.skill !== "meaning")?.itemId;
      }
      return starvedItemId ? removeItem(plan, starvedItemId) : plan;
    };
  } else if (mutation === "show-entire-recovery-backlog") {
    hooks.mutateDay = (day, context) => day.active && day.backlogSeconds > 0
      ? {
          ...day,
          plannedSeconds: Math.max(
            day.plannedSeconds,
            day.backlogSeconds + context.options.dailyBudgetSeconds,
          ),
        }
      : day;
  } else if (mutation === "synchronize-provisionals") {
    hooks.mutateDay = (day, context) => (
      day.active && context.dayIndex >= 4 && context.dayIndex % 7 === 6
        ? {
            ...day,
            provisionalDue: Math.max(100, day.provisionalDue),
            usageActivations: Math.max(100, day.usageActivations),
            plannedSeconds: context.options.dailyBudgetSeconds * 2,
          }
        : day
    );
  } else if (mutation === "low-retention") {
    hooks.mutateCompletions = (completions) => completions.map((completion) => ({
      ...completion,
      assessment: {
        ...completion.assessment,
        grade: "Again",
        correct: false,
        firstTryFailed: true,
      },
      ...(completion.scheduledReview
        ? {
            scheduledReview: {
              ...completion.scheduledReview,
              recalled: false,
              grade: "Again" as const,
            },
          }
        : {}),
    }));
  } else if (mutation === "perfect-retention") {
    hooks.mutateCompletions = (completions) => completions.map((completion) => ({
      ...completion,
      assessment: {
        ...completion.assessment,
        grade: "Easy",
        correct: true,
        usedHints: false,
        rescued: false,
        firstTryFailed: false,
      },
      ...(completion.scheduledReview
        ? {
            scheduledReview: {
              ...completion.scheduledReview,
              recalled: true,
              grade: "Easy" as const,
            },
          }
        : {}),
    }));
  }

  return hooks;
}

export function runAdversarialSimulation(
  mutation: SimulationMutation,
  profile: SimulationProfile,
  options: SimulationOptions,
): SimulationResult {
  return runSimulation(profile, options, hooksForMutation(mutation));
}

function failed(result: { passed: boolean }): boolean {
  return !result.passed;
}

/** Explicit criterion mapping used only by adversarial assertions. */
export function failedCriterionNumbers(result: SimulationResult): number[] {
  const { days, options } = result;
  const failures: number[] = [];
  if (failed(budgetRespected(days, options.dailyBudgetSeconds))) failures.push(1);
  if (failed(percentile95WithinBudget(days, options.dailyBudgetSeconds))) failures.push(2);
  if (failed(recoveryExits(days))) failures.push(3);
  if (failed(backlogStable(days, 14, 2, options.dailyBudgetSeconds))) failures.push(4);
  if (failed(recoveryReturnSessions(days, 14))) failures.push(5);
  if (failed(usageActivationShare(days, 7, 10, 0.3))) failures.push(6);
  if (failed(noSynchronizedPeaks(days, options.dailyBudgetSeconds))) failures.push(7);
  if (failed(newWordLiveness(days, options.targetNewWords))) failures.push(8);
  if (failed(baseSkillActivationLiveness(result.eligibility, 8))) failures.push(9);
  if (failed(noOverdueStarvation(result.deferredObservations, 12))) failures.push(10);
  if (failed(retentionCalibrationWithinExpected(
    result.attemptLogs,
    result.srsEvents,
    50,
  ))) failures.push(11);
  return failures;
}
