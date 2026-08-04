/**
 * Graduation grade from performance (Fase C, spec §3.4).
 *
 * Performance decides the grade; exercise mode only limits whether Easy is
 * reachable. Full production is the cloze_sentence -> dictation_sentence
 * chain, and both modes share the same Easy ceiling.
 */

import type { Grade } from "@/lib/srs/fsrs-schedule";
import type { EssentialWordMode } from "./exercise-modes";

const FULL_PRODUCTION_MODES: ReadonlySet<EssentialWordMode> = new Set([
  "cloze_sentence",
  "dictation_sentence",
]);

export const LOW_LATENCY_MS = 25_000;

export interface GraduationOutcome {
  hintsUsed: number;
  latencyMs: number;
  mode: EssentialWordMode;
}

export type GraduationGrade = Extract<Grade, "Easy" | "Good">;

/**
 * Grades the successful final-round attempt used to graduate a word. A
 * failed final round does not call this function, so Again/Hard are not
 * representable results here.
 */
export function graduationGrade(outcome: GraduationOutcome): GraduationGrade {
  const isFullProduction = FULL_PRODUCTION_MODES.has(outcome.mode);
  const isClean = outcome.hintsUsed === 0 && outcome.latencyMs < LOW_LATENCY_MS;
  return isClean && isFullProduction ? "Easy" : "Good";
}
