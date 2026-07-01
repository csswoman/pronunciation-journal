"use client";

interface AuthFeedbackProps {
  error?: string | null;
  message?: string | null;
  compact?: boolean;
}

export function AuthFeedback({ error, message, compact = false }: AuthFeedbackProps) {
  if (!error && !message) return null;

  const messageClassName = compact
    ? "rounded-xl px-3 py-2.5 text-sm mt-4 bg-[var(--success-soft)] border border-[var(--success-border)] text-[var(--success)]"
    : "rounded-xl px-3 py-2.5 text-sm mb-4 bg-[var(--success-soft)] border border-[var(--success-border)] text-[var(--success)]";

  return (
    <>
      {error && (
        <div
          className="rounded-xl px-3 py-2.5 text-sm mb-4 bg-[var(--error-soft)] border border-[var(--error-border)] text-[var(--error)]"
          role="alert"
        >
          {error}
        </div>
      )}
      {message && (
        <div className={messageClassName}>
          {message}
        </div>
      )}
    </>
  );
}
