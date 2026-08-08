// Fase 8 final simplification (docs/superpowers/plans/notes/
// 2026-08-07-fase8-final-planner-simplification.md §10): moved from
// lib/essential-words/ into simulation/ — only ever consumed by
// simulation/day-forecast-telemetry.ts and simulation/mandatory-feasibility.ts,
// never by a runtime admission gate.
import type { AdmissionLoadEnvelope } from "./admission-envelope";
import { totalExpectedReviewSeconds } from "./admission-envelope";

export interface ThroughputRates {
  actualArrivalSecondsPerSession: number;
  requiredArrivalSecondsPerSession: number;
  sustainableServiceSecondsPerSession: number;
}

/** Per new word: immediate + base activations + expected FSRS debt in horizon. */
export function envelopeSecondsPerNewWord(envelope: AdmissionLoadEnvelope): number {
  return envelope.immediateSeconds
    + envelope.baseActivationSeconds
    + totalExpectedReviewSeconds(envelope);
}

/**
 * Required arrival for C8 target demand — never derived from admitted words.
 * requiredNewWords = ceil(target * minimumC8Share) when C8 applies.
 */
export function computeRequiredArrivalSecondsPerSession(input: {
  targetNewWordsPerSession: number;
  minimumC8Share: number;
  envelope: AdmissionLoadEnvelope;
  c8Applicable: boolean;
}): number {
  if (!input.c8Applicable) return 0;
  const requiredNewWords = Math.ceil(
    input.targetNewWordsPerSession * input.minimumC8Share,
  );
  return requiredNewWords * envelopeSecondsPerNewWord(input.envelope);
}

export function computeThroughputRates(input: {
  actualAdmittedNewWordsPerSession: number;
  requiredArrivalSecondsPerSession: number;
  sustainableServiceSecondsPerSession: number;
  secondsPerActualNewWord: number;
}): ThroughputRates {
  return {
    actualArrivalSecondsPerSession: Math.max(0, input.actualAdmittedNewWordsPerSession)
      * Math.max(0, input.secondsPerActualNewWord),
    requiredArrivalSecondsPerSession: Math.max(0, input.requiredArrivalSecondsPerSession),
    sustainableServiceSecondsPerSession: Math.max(0, input.sustainableServiceSecondsPerSession),
  };
}
