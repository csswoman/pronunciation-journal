import type { ExerciseSessionSummary } from "../PracticeSession";

/**
 * Label for the divider that stands in for the hidden "I just finished…" send.
 *
 * Always Spanish: this is chrome the learner reads to orient themselves, not
 * the English being taught, so it stays legible at A1 regardless of the
 * language the coach is replying in.
 */
export function exerciseResultMarker(summary: ExerciseSessionSummary): string {
  const { correct, total } = summary;
  const unit = total === 1 ? "ejercicio" : "ejercicios";
  return `Práctica completada · ${correct} de ${total} ${unit}`;
}
