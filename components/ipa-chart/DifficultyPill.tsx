"use client";

import Badge from "@/components/ui/Badge";
import type { Difficulty } from "@/lib/ipa-data";

const variantMap = {
  easy:   "success",
  medium: "warning",
  hard:   "error",
} as const;

export default function DifficultyPill({
  difficulty,
  label,
  muted,
}: {
  difficulty: Difficulty;
  label?: string;
  muted?: boolean;
}) {
  if (muted) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "white" }}>
        <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-current" />
        {label ?? difficulty}
      </span>
    );
  }

  return <Badge label={label ?? difficulty} variant={variantMap[difficulty]} dot />;
}
