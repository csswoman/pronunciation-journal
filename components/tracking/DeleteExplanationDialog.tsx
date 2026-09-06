"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "@/components/icons";
import Button from "@/components/ui/Button";
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

  const remove = async () => {
    if (deleting) return;
    setDeleting(true);
    setError(null);
    try {
      await onConfirm(source);
      onClose();
    } catch {
      setError("No pudimos eliminar la explicación. Inténtalo de nuevo.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "var(--overlay-medium)" }}
      onClick={() => !deleting && onClose()}
    >
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-explanation-title"
        aria-describedby="delete-explanation-description"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-md rounded-[var(--radius-lg)] border border-border-subtle bg-surface-raised shadow-xl"
      >
        <div className="layout-card-pad">
          <span className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-error-soft text-error">
            <Trash2 size={18} aria-hidden />
          </span>
          <h2 id="delete-explanation-title" className="mt-4 text-h3 text-fg">
            Eliminar “{source.item.title}”
          </h2>
          <p id="delete-explanation-description" className="mt-2 text-body-sm text-fg-muted">
            Se eliminará esta explicación guardada. Esta acción no se puede deshacer.
          </p>
          {error ? <p role="alert" className="mt-3 text-body-sm text-error">{error}</p> : null}
        </div>
        <footer className="flex justify-end gap-2 border-t border-border-subtle bg-surface-base px-[var(--layout-card-pad)] py-4">
          <Button variant="ghost" onClick={onClose} disabled={deleting}>Cancelar</Button>
          <Button variant="danger" onClick={() => void remove()} disabled={deleting} isLoading={deleting} icon={<Trash2 size={15} aria-hidden />}>
            Eliminar
          </Button>
        </footer>
      </section>
    </div>
  );
}
