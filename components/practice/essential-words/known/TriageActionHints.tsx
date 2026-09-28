"use client";

// Planned structure:
// <TriageActionHints>
//   <ActionHintButtons />
//   <ActionHintKeyboardLegend />
// </TriageActionHints>

import { useEffect } from "react";
import { ArrowLeft, ArrowRight, Undo2, Check, X } from "@/components/icons";

interface TriageActionHintsProps {
  onKnown: () => void;
  onSkip: () => void;
  onUndo?: () => void;
  canUndo?: boolean;
  disabled?: boolean;
}

export function TriageActionHints({
  onKnown,
  onSkip,
  onUndo,
  canUndo = false,
  disabled = false,
}: TriageActionHintsProps) {
  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.isContentEditable
          || Boolean(target.closest?.("input, textarea, select, button, a, [role='button'], [role='slider']")))
      ) {
        return;
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        onKnown();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        onSkip();
      } else if ((e.key === "z" || e.key === "Z" || e.key === "Backspace") && canUndo && onUndo) {
        e.preventDefault();
        onUndo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [disabled, onKnown, onSkip, onUndo, canUndo]);

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <div className="flex w-full items-center justify-between gap-3 sm:gap-4 max-w-md mx-auto">
        {/* Left: Ya la sé */}
        <button
          type="button"
          onClick={onKnown}
          disabled={disabled}
          aria-label="Ya la sé (Deslizar izquierda)"
          className="group flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-surface-raised border border-success/40 text-success hover:bg-success/10 active:scale-98 transition-all motion-reduce:transition-none cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
        >
          <ArrowLeft size={18} className="transition-transform motion-reduce:transition-none group-hover:-translate-x-1" />
          <Check size={18} />
          <span className="font-bold text-sm sm:text-base">Ya la sé</span>
        </button>

        {/* Undo (Center, if available) */}
        {canUndo && onUndo && (
          <button
            type="button"
            onClick={onUndo}
            disabled={disabled}
            aria-label="Deshacer última acción"
            className="flex items-center justify-center size-11 shrink-0 rounded-2xl bg-surface-raised border border-border-default text-fg-muted hover:text-fg hover:bg-surface-sunken active:scale-95 transition-all motion-reduce:transition-none cursor-pointer disabled:opacity-50"
            title="Deshacer (Z)"
          >
            <Undo2 size={18} />
          </button>
        )}

        {/* Right: No la sé */}
        <button
          type="button"
          onClick={onSkip}
          disabled={disabled}
          aria-label="No la sé (Deslizar derecha)"
          className="group flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-surface-raised border border-warning/40 text-warning hover:bg-warning/10 active:scale-98 transition-all motion-reduce:transition-none cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
        >
          <span className="font-bold text-sm sm:text-base">No la sé</span>
          <X size={18} />
          <ArrowRight size={18} className="transition-transform motion-reduce:transition-none group-hover:translate-x-1" />
        </button>
      </div>

      {/* Keyboard hotkey hint */}
      <p className="text-xs text-fg-subtle text-center m-0 select-none">
        Usa las flechas <kbd className="px-1.5 py-0.5 rounded bg-surface-sunken border border-border-subtle font-mono text-[10px]">←</kbd> y <kbd className="px-1.5 py-0.5 rounded bg-surface-sunken border border-border-subtle font-mono text-[10px]">→</kbd> en el teclado
      </p>
    </div>
  );
}
