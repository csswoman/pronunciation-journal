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
      className={cn("ipa-chart__mpchip", isActive && "ipa-chart__mpchip--on")}
    >
      <span>{contrast.phonemeA}</span>
      <span className="ipa-chart__mpchip-vs">vs</span>
      <span>{contrast.phonemeB}</span>
    </button>
  );
}
