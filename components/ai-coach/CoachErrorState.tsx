"use client";

import { RefreshCw } from "@/components/icons";

// Planned structure:
// <CoachErrorState>   (single responsibility: recover from a failed coach turn)

interface CoachErrorStateProps {
  /** Human-facing reason, already localized. Falls back to a generic line. */
  message?: string | null;
  onRetry: () => void;
  onDismiss: () => void;
  retrying?: boolean;
}

const DEFAULT_MESSAGE =
  "No pudimos preparar tu práctica. Suele ser algo puntual de la conexión o del servicio.";

export default function CoachErrorState({
  message,
  onRetry,
  onDismiss,
  retrying = false,
}: CoachErrorStateProps) {
  return (
    <div
      role="alert"
      className="mx-4 my-3 space-y-3 rounded-2xl border border-error-border/50 bg-error-soft p-4"
    >
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-error-icon-bg">
          <RefreshCw size={14} className="text-error-value" />
        </span>
        <p className="text-body-sm font-semibold text-fg">Algo salió mal</p>
      </div>

      <p className="text-body-sm leading-relaxed text-fg-muted">
        {message?.trim() ? message : DEFAULT_MESSAGE}
      </p>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onRetry}
          disabled={retrying}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-cta-bg py-2 text-caption font-semibold text-cta-fg transition-colors hover:bg-cta-bg-hover disabled:opacity-60 focus-ring cursor-pointer"
        >
          <RefreshCw size={13} aria-hidden className={retrying ? "animate-spin" : undefined} />
          {retrying ? "Reintentando…" : "Reintentar"}
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-xl border border-border-subtle bg-surface-base px-3 py-2 text-caption font-medium text-fg-muted transition-colors hover:text-fg hover:border-border-default focus-ring cursor-pointer"
        >
          Descartar
        </button>
      </div>
    </div>
  );
}
