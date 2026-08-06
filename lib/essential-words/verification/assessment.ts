import { attemptGrade, type AttemptOutcome } from "../attempt-grade";
import type { AttemptAssessment, AttemptModality } from "./types";

export interface AssessmentContext {
  interactionDurationMs: number;
  freeAudioReplays?: number;
}

/**
 * Adapts a card's legacy outcome to the richer, immutable attempt record used
 * by the skill model. Grading remains delegated to the legacy pure function
 * until the skill engine takes ownership of scheduling.
 */
export function buildAssessment(
  outcome: AttemptOutcome,
  modality: AttemptModality,
  context: AssessmentContext,
): AttemptAssessment {
  return {
    grade: attemptGrade(outcome),
    modality,
    correct: outcome.correct || outcome.typo,
    latencyMs: outcome.latencyMs,
    interactionDurationMs: Math.max(
      context.interactionDurationMs,
      outcome.latencyMs,
    ),
    usedHints: outcome.hintsUsed > 0,
    rescued: outcome.rescued,
    acceptedVariant: outcome.typo,
    firstTryFailed: outcome.firstTryFailed,
    freeAudioReplays: context.freeAudioReplays ?? 0,
  };
}
