"use client";

// Planned structure:
// <DeleteExplanationDialog>
//   <Backdrop />
//   <DialogContainer: IconHeader + Title(Bricolage) + BodyText + FooterButtons />
// </DeleteExplanationDialog>

import { useEffect, useState } from "react";
import { Trash2 } from "@/components/icons";
import type { TrackingReviewSource } from "@/lib/tracking/review-queue";

interface Props {
  source: TrackingReviewSource | null;
  onClose: () => void;
  onConfirm: (source: TrackingReviewSource) => Promise<void>;
}

export function DeleteExplanationDialog({ source, onClose, onConfirm }: Props) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!source) return;
    setDeleting(false);
    setError(null);
  }, [source]);

  if (!source) return null;

  const isPhrase = source.item.kind === "phrase";
  const label = isPhrase ? "frase" : "explicación";

  const remove = async () => {
    if (deleting) return;
    setDeleting(true);
    setError(null);
    try {
      await onConfirm(source);
      onClose();
    } catch {
      setError(`No pudimos eliminar la ${label}. Inténtalo de nuevo.`);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-[fade-in_150ms_ease-out]"
      onClick={() => !deleting && onClose()}
    >
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-tracked-title"
        aria-describedby="delete-tracked-description"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-md overflow-hidden rounded-[28px] border border-border-subtle bg-surface-raised p-6 shadow-2xl transition-all"
      >
        <div>
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-500/10 text-red-600 dark:bg-red-950/40 dark:text-red-400">
            <Trash2 size={20} aria-hidden />
          </span>
          <h2 id="delete-tracked-title" className="mt-4 font-display text-2xl font-bold text-fg leading-tight">
            Eliminar “{source.item.title}”
          </h2>
          <p id="delete-tracked-description" className="mt-2 text-body-sm text-fg-muted leading-relaxed">
            Se eliminará esta {label} guardada. Esta acción no se puede deshacer.
          </p>
          {error ? <p role="alert" className="mt-3 text-body-sm text-error font-medium">{error}</p> : null}
        </div>

        <footer className="mt-6 pt-4 border-t border-border-subtle flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="focus-ring rounded-full px-5 py-2 text-body-sm font-semibold border border-border-subtle bg-surface-raised hover:bg-surface-sunken text-fg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void remove()}
            disabled={deleting}
            aria-label="Eliminar"
            className="focus-ring rounded-full px-5 py-2 bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 font-semibold text-body-sm disabled:opacity-50 transition-colors shadow-xs flex items-center gap-2"
          >
            <Trash2 size={16} aria-hidden />
            <span>{deleting ? "Eliminando..." : "Eliminar"}</span>
          </button>
        </footer>
      </section>
    </div>
  );
}
