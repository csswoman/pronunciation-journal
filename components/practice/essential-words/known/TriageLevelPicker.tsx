"use client";

// Planned structure:
// <TriageLevelPicker>
//   <LevelPickerLabel />
//   <LevelChipsList />
// </TriageLevelPicker>

import { CEFR_LEVELS, type CefrLevel } from "@/lib/essential-words/types";
import { cn } from "@/lib/cn";

interface TriageLevelPickerProps {
  selectedLevels: readonly CefrLevel[];
  onToggleLevel: (level: CefrLevel) => void;
  disabled?: boolean;
}

export function TriageLevelPicker({
  selectedLevels,
  onToggleLevel,
  disabled = false,
}: TriageLevelPickerProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-surface-raised border border-border-default w-full max-w-md mx-auto">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-fg-muted uppercase tracking-wider">
          Niveles CEFR:
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Seleccionar niveles CEFR">
        {CEFR_LEVELS.map((level) => {
          const isSelected = selectedLevels.includes(level);
          const isOnlyOne = isSelected && selectedLevels.length === 1;

          return (
            <button
              key={level}
              type="button"
              disabled={disabled || isOnlyOne}
              onClick={() => onToggleLevel(level)}
              aria-pressed={isSelected}
              className={cn(
                "px-2.5 py-1 rounded-xl text-xs font-bold transition-all motion-reduce:transition-none cursor-pointer border select-none",
                isSelected
                  ? "bg-primary text-primary-fg border-primary shadow-xs"
                  : "bg-surface-sunken text-fg-muted border-border-subtle hover:text-fg hover:border-border-muted",
                isOnlyOne && "opacity-75 cursor-default",
                disabled && "opacity-50 pointer-events-none"
              )}
              title={isOnlyOne ? "Debe haber al menos un nivel seleccionado" : undefined}
            >
              {level}
            </button>
          );
        })}
      </div>
    </div>
  );
}
