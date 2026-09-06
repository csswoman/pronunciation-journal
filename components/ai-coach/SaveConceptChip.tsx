"use client";

import { useState } from "react";
import { BookMarked, Check, RotateCcw } from "@/components/icons";
import { cn } from "@/lib/cn";

// Planned structure:
// <SaveConceptChip> — one pill; saves the whole coach explanation

type ChipState = "idle" | "saving" | "saved" | "error";

interface SaveConceptChipProps {
  onSave: () => Promise<void>;
}

export default function SaveConceptChip({ onSave }: SaveConceptChipProps) {
  const [state, setState] = useState<ChipState>("idle");

  const handleSave = async () => {
    setState("saving");
    try {
      await onSave();
      setState("saved");
    } catch (err) {
      console.error("[SaveConceptChip] save failed", err);
      setState("error");
    }
  };

  const isSaved = state === "saved";
  const isError = state === "error";

  return (
    <div className="flex" aria-label="Guardar la explicación del coach">
      <button
        type="button"
        disabled={state === "saving" || isSaved}
        onClick={() => void handleSave()}
        className={cn(
          "flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full border px-3",
          "text-caption font-medium whitespace-nowrap",
          "transition-colors duration-150 focus-ring",
          "disabled:cursor-default",
          isSaved
            ? "border-success bg-success-soft text-success"
            : isError
              ? "border-warning bg-warning-soft text-warning"
              : "border-border-subtle bg-surface-raised text-fg-muted hover:border-primary hover:bg-primary-soft hover:text-primary",
        )}
      >
        {isSaved ? (
          <Check size={13} strokeWidth={2.25} aria-hidden />
        ) : isError ? (
          <RotateCcw size={13} strokeWidth={2} aria-hidden />
        ) : (
          <BookMarked size={13} strokeWidth={2} aria-hidden />
        )}
        {isSaved
          ? "Guardada"
          : isError
            ? "Guardar explicación · reintentar"
            : "Guardar explicación"}
      </button>
    </div>
  );
}
