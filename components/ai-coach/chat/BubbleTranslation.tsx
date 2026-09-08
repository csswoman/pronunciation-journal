"use client";

import { cn } from "@/lib/cn";

// Planned structure:
// <BubbleTranslation>  (leaf)

export interface BubbleTranslationProps {
  translation: string | null;
  isLoading: boolean;
  hasError: boolean;
  onRetry: () => void;
}

export default function BubbleTranslation({
  translation,
  isLoading,
  hasError,
  onRetry,
}: BubbleTranslationProps) {
  return (
    <div className="mt-2.5 pt-2 border-t border-border-subtle/80 text-caption text-fg-muted bg-surface-sunken/60 px-3 py-2 rounded-md">
      <div className="flex items-center justify-between mb-0.5">
        <span className="font-semibold text-xxs uppercase tracking-wider text-primary">Traducción</span>
        {hasError && (
          <button
            type="button"
            onClick={onRetry}
            disabled={isLoading}
            className="text-xxs font-semibold text-primary hover:underline cursor-pointer"
          >
            {isLoading ? "Cargando..." : "Reintentar"}
          </button>
        )}
      </div>
      <p className={cn("m-0 text-pretty text-body-sm leading-relaxed", hasError && "text-error font-medium")}>
        {isLoading ? "Cargando traducción..." : (translation || "Cargando traducción...")}
      </p>
    </div>
  );
}
