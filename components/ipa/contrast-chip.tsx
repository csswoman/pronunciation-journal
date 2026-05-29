"use client";

import { cn } from "@/lib/cn";
import type { MinimalPairContrast } from "./minimal-pairs-data";

interface ContrastChipProps {
  contrast: MinimalPairContrast;
  isActive: boolean;
  onClick: () => void;
}

export function ContrastChip({ contrast, isActive, onClick }: ContrastChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium",
        "transition-all duration-150 hover:-translate-y-0.5",
        "active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
        isActive
          ? "bg-[var(--text-primary)] border-[var(--text-primary)] text-[var(--card-bg)]"
          : "bg-[var(--card-bg)] border-[var(--line-divider)] text-[var(--text-primary)]"
      )}
    >
      <span className="font-serif text-base">{contrast.phonemeA}</span>
      <span className="text-tiny uppercase tracking-widest opacity-60">vs</span>
      <span className="font-serif text-base">{contrast.phonemeB}</span>
    </button>
  );
}
