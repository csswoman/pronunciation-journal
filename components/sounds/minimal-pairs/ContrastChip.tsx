"use client";

import { cn } from "@/lib/cn";
import type { MinimalPairContrast } from "@/lib/sounds/minimal-pairs";

export function ContrastChip({
  contrast,
  isActive,
  onClick,
}: {
  contrast: MinimalPairContrast;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("ipa-chart__mpchip", isActive && "ipa-chart__mpchip--on")}
      aria-pressed={isActive}
    >
      <span>{contrast.phonemeA}</span>
      <span className="ipa-chart__mpchip-vs">vs</span>
      <span>{contrast.phonemeB}</span>
    </button>
  );
}
