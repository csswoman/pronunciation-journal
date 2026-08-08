import { FSRS_DESIRED_RETENTION } from "@/lib/srs/fsrs-schedule";
import type { AttemptModality } from "../verification/types";

/**
 * Fase 8 final simplification (docs/superpowers/plans/notes/
 * 2026-08-07-fase8-final-planner-simplification.md §4/C). This module used
 * to live in `lib/essential-words/` and gate admission at runtime twice
 * (placement + new-word) via a shared forecast reserve. The runtime gate is
 * now a 3-line inline amortized cost inside `daily-budget.ts`
 * (`perNewWordAmortized`) — no versioned envelope object. This module
 * survives only as a `simulation/` telemetry helper: `day-forecast-telemetry.ts`
 * still reports the modeled review-debt-per-session breakdown for diagnostic
 * dashboards, which is legitimately richer than what the runtime gate needs.
 *
 * Calculation (simulation-model):
 * - immediateSeconds = newWordIntroduction + recognition (meaning intro)
 * - baseActivationSeconds = listening + production (C9 pair within 8 sessions)
 * - expectedReviewSecondsBySession: first FSRS Review after an Easy grade from
 *   New lands at interval ~8 days (ts-fsrs default, desiredRetention=0.9).
 *   On a daily active calendar that maps to sessionOffset 8. Cost = recognition
 *   (meaning). Listening/production first reviews typically fall outside the
 *   immediate 8-session horizon after activation, so they are not hard-coded
 *   into the envelope; their activation cost is already in baseActivationSeconds.
 */
export const ADMISSION_LOAD_ENVELOPE_VERSION = "admission-envelope-v1";

export interface AdmissionLoadEnvelope {
  version: string;
  immediateSeconds: number;
  baseActivationSeconds: number;
  expectedReviewSecondsBySession: readonly number[];
  provenance: "simulation-model" | "empirical";
  /** Documentary: FSRS desired retention used for the interval model. */
  desiredRetention: number;
  /** Documentary: first Easy interval from New in whole days. */
  firstEasyReviewDays: number;
}

/** First Easy interval from New in ts-fsrs@5.4.1 defaults (see fsrs-schedule tests). */
export const FSRS_NEW_EASY_INTERVAL_DAYS = 8;

export function buildAdmissionLoadEnvelope(input: {
  costs: Record<AttemptModality, number>;
  introductionSeconds: number;
  horizonSessions: number;
}): AdmissionLoadEnvelope {
  const horizon = Math.max(0, Math.floor(input.horizonSessions));
  const expectedReviewSecondsBySession = Array.from({ length: horizon }, () => 0);
  const reviewSession = Math.min(FSRS_NEW_EASY_INTERVAL_DAYS, horizon);
  if (reviewSession >= 1 && horizon > 0) {
    expectedReviewSecondsBySession[reviewSession - 1] = input.costs.recognition;
  }

  return {
    version: ADMISSION_LOAD_ENVELOPE_VERSION,
    immediateSeconds: input.introductionSeconds + input.costs.recognition,
    baseActivationSeconds: input.costs.listening + input.costs.production,
    expectedReviewSecondsBySession,
    provenance: "simulation-model",
    desiredRetention: FSRS_DESIRED_RETENTION,
    firstEasyReviewDays: FSRS_NEW_EASY_INTERVAL_DAYS,
  };
}

export function totalExpectedReviewSeconds(envelope: AdmissionLoadEnvelope): number {
  return envelope.expectedReviewSecondsBySession.reduce((total, value) => total + value, 0);
}
