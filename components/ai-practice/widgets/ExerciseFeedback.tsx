"use client";

export type ExerciseFeedbackProps = {
  correct: boolean;
  explanation?: string;
  topic: string;
  attempts?: number;
  onNext?: () => void;
  onRetry?: () => void;
};

function getShortExplanation(text?: string): string {
  if (!text) return "";
  const clean = text.trim();
  if (clean.length <= 120) return clean;
  const trimmed = clean.slice(0, 120);
  const lastSpace = trimmed.lastIndexOf(" ");
  return trimmed.slice(0, lastSpace) + "...";
}

function getTip(explanation?: string): string {
  if (!explanation || explanation.trim().length < 20) return "";
  const clean = explanation.trim();
  // Extract first sentence as tip, max 80 chars
  const firstDot = clean.search(/[.!?]/);
  const sentence = firstDot > 0 ? clean.slice(0, firstDot + 1) : clean;
  if (sentence.length > 80) {
    const cut = sentence.slice(0, 80);
    const lastSpace = cut.lastIndexOf(" ");
    return cut.slice(0, lastSpace) + "...";
  }
  return sentence;
}

export default function ExerciseFeedback({
  correct,
  explanation,
  onNext,
  onRetry,
}: ExerciseFeedbackProps) {
  const shortExplanation = getShortExplanation(explanation);
  const hasExplanation = !!explanation && explanation.trim().length > 0;

  const title = correct ? "Correct!" : "Not quite";
  const message = correct
    ? hasExplanation
      ? `Nice job — ${shortExplanation}`
      : "Nice job!"
    : hasExplanation
    ? `Almost — ${shortExplanation}`
    : "Try again — focus on the correct form.";

  const tip = getTip(explanation);
  // Avoid showing tip if it's identical to the message content
  const showTip = tip.length > 0 && !message.includes(tip.replace(/\.$/, ""));

  const accentColor = correct ? "var(--success, #22c55e)" : "#ef4444";
  const icon = correct ? "✅" : "❌";

  return (
    <div
      className="rounded-lg px-3 py-2.5 space-y-2 text-sm animate-feedback-in"
      style={{
        backgroundColor: correct
          ? "color-mix(in oklch, var(--success, #22c55e) 12%, transparent)"
          : "color-mix(in oklch, #ef4444 10%, transparent)",
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

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-1">
          <p
            className="font-semibold leading-snug"
            style={{ color: accentColor }}
          >
            {icon} {title}
          </p>
          <p
            className="text-xs leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            {message}
          </p>
          {showTip && (
            <p
              className="text-xs leading-relaxed"
              style={{ color: "var(--text-muted, var(--text-secondary))", opacity: 0.8 }}
            >
              💡 Tip: {tip}
            </p>
          )}
        </div>

        <div className="shrink-0 flex flex-col gap-1.5">
          {correct && onNext && (
            <button
              onClick={onNext}
              className="text-xs px-3 py-1 rounded-lg font-medium transition-opacity hover:opacity-80"
              style={{ backgroundColor: accentColor, color: "#fff" }}
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
