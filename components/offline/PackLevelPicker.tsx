"use client";

// Planned structure:
// <PackLevelPicker>
//   <label /> × 5 (radio A1–C1)
// </PackLevelPicker>

import type { CefrLevel } from "@/lib/essential-words/types";
import { OFFLINE_PACK_LEVELS } from "@/lib/offline/pack-types";
import { cn } from "@/lib/cn";

interface PackLevelPickerProps {
  value: CefrLevel | null;
  onChange: (level: CefrLevel) => void;
}

/** Explicit level choice when the canonical level is unknown — no preselection. */
export function PackLevelPicker({ value, onChange }: PackLevelPickerProps) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-caption text-fg-muted">
        No pudimos confirmar tu nivel. Elige qué paquete quieres guardar:
      </legend>
      <div className="flex flex-wrap gap-2">
        {OFFLINE_PACK_LEVELS.map((level) => (
          <label
            key={level}
            className={cn(
              "inline-flex cursor-pointer items-center rounded-full border px-3 py-1.5 text-caption font-medium focus-within:ring-2 focus-within:ring-primary",
              value === level
                ? "border-primary bg-surface-sunken text-fg"
                : "border-border-subtle text-fg-muted hover:bg-surface-sunken",
            )}
          >
            <input
              type="radio"
              name="offline-pack-level"
              value={level}
              checked={value === level}
              onChange={() => onChange(level)}
              className="sr-only"
            />
            {level}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
