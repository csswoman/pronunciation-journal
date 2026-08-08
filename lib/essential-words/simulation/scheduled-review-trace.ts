import type { Grade } from "../attempt-grade";
import type {
  AttemptModality,
  ItemSchedule,
  Skill,
} from "../verification/types";

type FsrsSchedule = Extract<ItemSchedule, { kind: "fsrs" }>;
import { isScheduledReviewEligibleForC11 } from "./criteria";
import type { SimulationHarnessHooks } from "./observations";
import type { SimulationProfile } from "./profiles";
import { findWordItem } from "./state";
import { runSimulation, type SimulationResult } from "./run-simulation";
import type { SimulationOptions } from "./state";

/**
 * Full diagnostic trace of one scheduled-review attempt (Task 8.9g §1).
 *
 * This module never changes what the simulation does — `mutateCompletions`
 * only reads. It exists to answer, for every single scheduled review, "what
 * variable determined `recalled`?" without guessing from aggregates.
 *
 * NOTE on `fluency`: this codebase has no distinct "fluency" metric. The
 * closest analogues — hint usage, rescue, first-try-failure and latency —
 * are captured under `executionQuality` instead of inventing a new field.
 */
export interface ScheduledReviewTraceEntry {
  itemId: string;
  wordId: string;
  skill: Skill;
  modality: AttemptModality;
  /** FSRS state/stability/difficulty of the item *before* this attempt. */
  scheduleStateBefore: FsrsSchedule["state"];
  stabilityBefore: number;
  difficultyBefore: number;
  dueAt: string;
  attemptedAt: string;
  retrievability: number;
  rngSample: number;
  recalled: boolean;
  modalityAccuracy: number;
  executionQuality: {
    hintsUsed: boolean;
    rescued: boolean;
    firstTryFailed: boolean;
    latencyMs: number;
  };
  selectedGrade: Grade;
  affectsSchedule: true;
  /** Computed with the same canonical predicate C11 itself uses — never a
   * re-derived approximation (Task 8.9g §4). */
  includedInC11: boolean;
  /** `AttemptAssessment.correct` as produced for this attempt — used to
   * verify it never diverges from `recalled` for a scheduled review. */
  assessmentCorrect: boolean;
}

export interface ScheduledReviewTraceResult {
  entries: ScheduledReviewTraceEntry[];
  result: SimulationResult;
}

/**
 * Runs a full simulation and captures one trace entry per scheduled-review
 * attempt, sourced from the exact same completion objects that feed
 * `applyCompletedSession` — no parallel recomputation of recall or grade.
 */
export function traceScheduledReviews(
  profile: SimulationProfile,
  options: SimulationOptions,
  extraHooks: SimulationHarnessHooks = {},
): ScheduledReviewTraceResult {
  const entries: ScheduledReviewTraceEntry[] = [];

  const hooks: SimulationHarnessHooks = {
    ...extraHooks,
    mutateCompletions: (completions, context) => {
      for (const completion of completions) {
        const { scheduledReview } = completion;
        if (!scheduledReview) continue;

        const word = context.world.words.get(completion.item.wordId);
        const priorItem = word ? findWordItem(word, completion.item.itemId) : undefined;
        const priorSchedule = priorItem?.schedule;
        if (!priorSchedule || priorSchedule.kind !== "fsrs") continue;

        entries.push({
          itemId: completion.item.itemId,
          wordId: completion.item.wordId,
          skill: completion.item.skill,
          modality: completion.item.modality,
          scheduleStateBefore: priorSchedule.state,
          stabilityBefore: priorSchedule.stability,
          difficultyBefore: priorSchedule.difficulty,
          dueAt: completion.item.dueAt,
          attemptedAt: context.now.toISOString(),
          retrievability: scheduledReview.retrievability,
          rngSample: scheduledReview.rngSample,
          recalled: scheduledReview.recalled,
          modalityAccuracy: profile.accuracyByModality[completion.item.modality],
          executionQuality: {
            hintsUsed: completion.assessment.usedHints,
            rescued: completion.assessment.rescued,
            firstTryFailed: completion.assessment.firstTryFailed,
            latencyMs: completion.assessment.latencyMs,
          },
          selectedGrade: scheduledReview.grade,
          affectsSchedule: true,
          includedInC11: isScheduledReviewEligibleForC11(
            { eventType: "scheduled-review" },
            { affectsSchedule: scheduledReview.affectsSchedule },
          ),
          assessmentCorrect: completion.assessment.correct,
        });
      }
      return extraHooks.mutateCompletions?.(completions, context) ?? completions;
    },
  };

  const result = runSimulation(profile, options, hooks);
  return { entries, result };
}

/** Task 8.9g §2 — the one invariant every scheduled review must satisfy. */
export function violatesRecallInvariant(entry: ScheduledReviewTraceEntry): boolean {
  return entry.recalled !== (entry.rngSample < entry.retrievability);
}
