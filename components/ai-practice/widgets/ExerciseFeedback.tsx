"use client";

import type { EvaluationResult } from "@/lib/exercise/design";

export type ExerciseFeedbackProps = {
  result: EvaluationResult;
  onNext?: () => void;
  onRetry?: () => void;
};

export default function ExerciseFeedback({ result, onNext, onRetry }: ExerciseFeedbackProps) {
  const { correct, feedback } = result;
  const accentColor = correct ? "var(--score-excellent)" : "var(--score-poor)";
  const icon = correct ? "✅" : "❌";

  return (
    <div
      className="rounded-lg px-3 py-2.5 space-y-2 text-sm animate-feedback-in"
      style={{
        backgroundColor: correct
          ? "color-mix(in oklch, var(--score-excellent) 12%, transparent)"
          : "color-mix(in oklch, var(--score-poor) 10%, transparent)",
        borderLeft: `3px solid ${accentColor}`,
      }}
    >
      <style>{`
        @keyframes feedbackIn {
          from { opacity: 0; transform: scale(0.98); }
          to   { opacity: 1; transform: scale(1); }
        }
        .animate-feedback-in {
          animation: feedbackIn 180ms ease-out both;
        }
      `}</style>

      <div className="flex flex-col gap-2.5">
        <div className="space-y-1">
          <p className="font-semibold leading-snug" style={{ color: accentColor }}>
            {icon} {feedback.immediate}
          </p>
          <p
            className="text-xs leading-relaxed whitespace-pre-wrap"
            style={{ color: "var(--text-secondary)" }}
          >
            {feedback.explanation}
          </p>
          {feedback.example && (
            <p
              className="text-xs leading-relaxed whitespace-pre-wrap font-mono"
              style={{ color: "var(--text-tertiary)" }}
            >
              {feedback.example}
            </p>
          )}
          {feedback.tip && (
            <p
              className="text-xs leading-relaxed whitespace-pre-wrap"
              style={{ color: "var(--text-muted, var(--text-secondary))", opacity: 0.8 }}
            >
              💡 {feedback.tip}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          {correct && onNext && (
            <button
              onClick={onNext}
              className="text-xs px-3 py-1 rounded-lg font-medium transition-opacity hover:opacity-80"
              style={{ backgroundColor: accentColor, color: "var(--on-primary)" }}
            >
              Next →
            </button>
          )}
          {!correct && onRetry && (
            <button
              onClick={onRetry}
              className="text-xs px-3 py-1 rounded-lg font-medium transition-opacity hover:opacity-80"
              style={{
                backgroundColor: "var(--btn-regular-bg)",
                color: "var(--text-primary)",
                border: "1px solid var(--line-divider)",
              }}
            >
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
