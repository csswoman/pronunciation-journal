"use client";

interface EntryFeedbackProps {
  error: string | null;
  success: string | null;
  sourceUrl: string | null;
}

export default function EntryFeedback({
  error,
  success,
  sourceUrl,
}: EntryFeedbackProps) {
  return (
    <>
      {error && (
        <div className="p-3 bg-error-soft border border-error rounded-md">
          <p className="text-sm text-error">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-3 bg-success-soft border border-success rounded-md">
          <p className="text-sm text-success">{success}</p>
        </div>
      )}

      {sourceUrl && (
        <div>
          <label className="block text-sm font-medium text-fg-muted mb-1">
            Diccionario
          </label>
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-info hover:text-info transition-colors text-sm"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
              <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
            </svg>
            <span>Ver en diccionario</span>
          </a>
        </div>
      )}
    </>
  );
}
