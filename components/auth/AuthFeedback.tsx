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
          className="rounded-[10px] px-3 py-2.5 text-[13.5px] mb-4"
          style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}
          role="alert"
        >
          {error}
        </div>
      )}
      {message && (
        <div
          className="rounded-[10px] px-3 py-2.5 text-[13.5px] mb-4"
          style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", color: "#4ade80" }}
        >
          {message}
        </div>
      )}
    </>
  );
}
