"use client";

// Planned structure:
// <LessonDownloadButton>
//   <DownloadActionIcon />
// </LessonDownloadButton>

import { useState, useCallback } from "react";
import { Download, Check, Loader2, Trash2 } from "@/components/icons";
import { useLessonDownload } from "@/lib/offline/download-manager";
import { cn } from "@/lib/cn";

interface LessonDownloadButtonProps {
  trackId: string;
  lessonNumber: number;
  slug?: string;
  title: string;
  variant?: "icon-only" | "badge";
  className?: string;
}

export function LessonDownloadButton({
  trackId,
  lessonNumber,
  slug,
  title,
  variant = "icon-only",
  className,
}: LessonDownloadButtonProps) {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const id = `${trackId}:${lessonNumber}`;
  const { isDownloaded, isDownloading, download, remove, error } = useLessonDownload(slug ? id : null);

  const handleAction = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!slug) return;

      if (isDownloaded) {
        if (!showConfirmDelete) {
          setShowConfirmDelete(true);
          // Auto-hide confirm state after 3 seconds
          setTimeout(() => setShowConfirmDelete(false), 3000);
          return;
        }
        await remove();
        setShowConfirmDelete(false);
      } else {
        await download({ trackId, lessonNumber, slug, title });
      }
    },
    [slug, isDownloaded, showConfirmDelete, download, remove, trackId, lessonNumber, title],
  );

  if (!slug) return null;

  if (variant === "badge") {
    return (
      <button
        type="button"
        onClick={handleAction}
        disabled={isDownloading}
        title={
          isDownloaded
            ? showConfirmDelete
              ? "Confirmar: eliminar de descargas"
              : "Descargada para offline (clic para borrar)"
            : "Descargar lección para uso sin conexión"
        }
        className={cn(
          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-caption font-mono transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-focus",
          isDownloaded
            ? showConfirmDelete
              ? "bg-danger/10 text-danger hover:bg-danger/20"
              : "bg-surface-raised text-fg-muted hover:text-fg border border-line"
            : "bg-surface-raised/50 text-fg-subtle hover:text-fg hover:bg-surface-raised border border-line-subtle",
          className,
        )}
      >
        {isDownloading ? (
          <Loader2 size={12} className="animate-spin text-fg-muted" />
        ) : isDownloaded ? (
          showConfirmDelete ? (
            <Trash2 size={12} className="text-danger" />
          ) : (
            <Check size={12} className="text-primary" />
          )
        ) : (
          <Download size={12} />
        )}
        <span>
          {isDownloading
            ? "Bajando..."
            : isDownloaded
              ? showConfirmDelete
                ? "Borrar"
                : "Offline"
              : "Descargar"}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleAction}
      disabled={isDownloading}
      aria-label={
        isDownloaded
          ? showConfirmDelete
            ? "Confirmar: eliminar lección descargada"
            : "Lección disponible offline. Clic para opciones de borrado."
          : "Descargar lección para uso sin conexión"
      }
      title={
        error ??
        (isDownloaded
          ? showConfirmDelete
            ? "Clic de nuevo para borrar de descargas"
            : "Disponible offline (clic para eliminar)"
          : "Descargar para uso sin conexión")
      }
      className={cn(
        "inline-flex items-center justify-center w-7 h-7 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-focus",
        isDownloaded
          ? showConfirmDelete
            ? "text-danger hover:bg-danger/10"
            : "text-primary hover:bg-surface-raised"
          : "text-fg-subtle hover:text-fg hover:bg-surface-raised",
        className,
      )}
    >
      {isDownloading ? (
        <Loader2 size={14} className="animate-spin" />
      ) : isDownloaded ? (
        showConfirmDelete ? (
          <Trash2 size={14} className="text-danger animate-pulse" />
        ) : (
          <Check size={14} className="text-primary" />
        )
      ) : (
        <Download size={14} />
      )}
    </button>
  );
}
