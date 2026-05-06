"use client";

interface AuthFeedbackProps {
  error?: string | null;
  message?: string | null;
}

export function AuthFeedback({ error, message }: AuthFeedbackProps) {
  if (!error && !message) return null;

  return (
    <>
      {error && (
        <div
          className="rounded-[10px] px-3 py-2.5 text-sm mb-4 bg-[var(--error-soft)] border border-[var(--error-border)] text-[var(--error)]"
          role="alert"
        >
          {error}
        </div>
      )}
      {message && (
        <div className="rounded-[10px] px-3 py-2.5 text-sm mb-4 bg-[var(--success-soft)] border border-[var(--success-border)] text-[var(--success)]">
          {message}
        </div>
      )}
    </>
  );
}
