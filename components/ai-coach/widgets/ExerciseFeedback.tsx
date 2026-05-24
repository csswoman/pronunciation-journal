"use client";

import type { EvaluationResult } from "@/lib/exercises/design";

export type ExerciseFeedbackProps = {
  result: EvaluationResult;
  onNext?: () => void;
  onRetry?: () => void;
};

export default function ExerciseFeedback({ result, onNext, onRetry }: ExerciseFeedbackProps) {
  const { correct, feedback } = result;
  const accentColor = correct ? "var(--success)" : "var(--error)";
  const bgColor     = correct ? "var(--success-soft)" : "var(--error-soft)";

  return (
    <div
      className="rounded-xl px-4 py-3 space-y-1.5 text-sm"
      style={{ backgroundColor: bgColor, borderLeft: `3px solid ${accentColor}` }}
    >
      <p className="font-semibold leading-snug" style={{ color: accentColor }}>
        {correct ? "✓" : "✗"} {feedback.immediate}
      </p>
      {feedback.explanation && (
        <p className="text-xs leading-relaxed text-[var(--text-secondary)] whitespace-pre-wrap">
          {feedback.explanation}
        </p>
      )}
      {feedback.example && (
        <p className="text-xs leading-relaxed font-mono text-[var(--text-tertiary)] whitespace-pre-wrap">
          {feedback.example}
        </p>
      )}
      {feedback.tip && (
        <p className="text-xs leading-relaxed text-[var(--text-secondary)] opacity-80 whitespace-pre-wrap">
          💡 {feedback.tip}
        </p>
      )}
      {!correct && onRetry && (
        <button
          onClick={onRetry}
          className="mt-1 text-xs px-3 py-1.5 rounded-full font-semibold border border-[var(--border-default)] bg-[var(--surface-raised)] text-[var(--text-secondary)] transition-opacity hover:opacity-70"
        >
          Try again
        </button>
      )}
    </div>
  );
}
