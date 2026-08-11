"use client";

import { ArrowRight, Check, Lightbulb, X } from "@/components/icons";
import type { EvaluationResult } from "@/lib/exercises/design";

export type ExerciseFeedbackProps = {
  result: EvaluationResult;
  onNext?: () => void;
  onRetry?: () => void;
};

export default function ExerciseFeedback({ result, onNext, onRetry }: ExerciseFeedbackProps) {
  const { correct, feedback } = result;
  const accentColor = correct ? "var(--success)" : "var(--error)";
  const bgColor = correct ? "var(--success-soft)" : "var(--error-soft)";
  const StatusIcon = correct ? Check : X;

  return (
    <div
      className="space-y-1.5 rounded-xl border px-4 py-3 text-body-sm"
      style={{ backgroundColor: bgColor, borderColor: accentColor }}
    >
      <p className="flex items-start gap-1.5 font-semibold leading-snug" style={{ color: accentColor }}>
        <StatusIcon size={16} strokeWidth={2.25} className="mt-0.5 shrink-0" aria-hidden />
        <span>{feedback.immediate}</span>
      </p>
      {feedback.explanation && (
        <p className="whitespace-pre-wrap text-body-sm leading-relaxed text-[var(--text-secondary)]">
          {feedback.explanation}
        </p>
      )}
      {feedback.example && (
        <p className="whitespace-pre-wrap font-mono text-body-sm leading-relaxed text-[var(--text-tertiary)]">
          {feedback.example}
        </p>
      )}
      {feedback.tip && (
        <p className="flex items-start gap-1.5 whitespace-pre-wrap text-body-sm leading-relaxed text-[var(--text-secondary)] opacity-80">
          <Lightbulb size={16} strokeWidth={2} className="mt-0.5 shrink-0" aria-hidden />
          <span>{feedback.tip}</span>
        </p>
      )}
      {!correct && onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-1 rounded-full border border-[var(--border-default)] bg-[var(--surface-raised)] px-3 py-1.5 text-caption font-semibold text-[var(--text-secondary)] transition-opacity hover:opacity-70"
        >
          Try again
        </button>
      )}
      {correct && onNext && (
        <button
          type="button"
          onClick={onNext}
          className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-[var(--primary)] px-3 py-1.5 text-caption font-semibold text-[var(--on-primary)] transition-opacity hover:opacity-90"
        >
          Next
          <ArrowRight size={14} strokeWidth={2.25} aria-hidden />
        </button>
      )}
    </div>
  );
}
