"use client";

import { useState } from "react";
import { Bookmark, Check, RotateCcw } from "@/components/icons";
import type { TurnSaveable } from "@/lib/ai-practice/tools/registry";
import { cn } from "@/lib/cn";

// Planned structure:
// <SaveChips>
//   <SaveChip /> × n — one pill per coach-proposed item
// </SaveChips>

type ChipState = "idle" | "saving" | "saved" | "error";

const chipKey = (s: TurnSaveable) => `${s.type}:${s.text}`;

interface SaveChipsProps {
  saveables: TurnSaveable[];
  onSave: (saveable: TurnSaveable) => Promise<void>;
}

export default function SaveChips({ saveables, onSave }: SaveChipsProps) {
  const [states, setStates] = useState<Record<string, ChipState>>({});

  if (saveables.length === 0) return null;

  const handleSave = async (saveable: TurnSaveable) => {
    const key = chipKey(saveable);
    setStates((prev) => ({ ...prev, [key]: "saving" }));
    try {
      await onSave(saveable);
      setStates((prev) => ({ ...prev, [key]: "saved" }));
    } catch (err) {
      console.error("[SaveChips] save failed", err);
      setStates((prev) => ({ ...prev, [key]: "error" }));
    }
  };

  return (
    <div className="flex flex-wrap gap-1.5" aria-label="Guardar de este mensaje">
      {saveables.map((saveable) => {
        const state = states[chipKey(saveable)] ?? "idle";
        const isSaved = state === "saved";
        const isError = state === "error";

        return (
          <button
            key={chipKey(saveable)}
            type="button"
            disabled={state === "saving" || isSaved}
            onClick={() => void handleSave(saveable)}
            title={saveable.meaning}
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
              <Bookmark size={13} strokeWidth={2} aria-hidden />
            )}
            {isSaved ? "Guardada" : isError ? `${saveable.text} · reintentar` : `+ ${saveable.text}`}
          </button>
        );
      })}
    </div>
  );
}
