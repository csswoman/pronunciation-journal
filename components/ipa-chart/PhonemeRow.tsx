"use client";

import type { MouseEvent } from "react";
import Button from "@/components/ui/Button";
import type { PhonemeData } from "./data";

export default function PhonemeRow({
  phoneme,
  isPlaying,
  isSelected,
  onPlay,
  onSelect,
}: {
  phoneme: PhonemeData;
  isPlaying: boolean;
  isSelected: boolean;
  onPlay: (event: MouseEvent) => void;
  onSelect: () => void;
}) {
  return (
    <Button
      type="button"
      onClick={onSelect}
      variant="outline"
      className={`w-full items-center justify-start gap-4 rounded-2xl border px-5 py-3 text-left transition-all duration-200 ${
        isSelected
          ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--on-primary)]"
          : "border-[var(--line-divider)] bg-[var(--card-bg)] text-[var(--text-primary)]"
      }`}
    >
      <span className="w-16 shrink-0 text-2xl font-serif font-bold">
        {phoneme.symbol}
      </span>
      <span className={`w-28 shrink-0 text-xs font-bold uppercase tracking-wider ${isSelected ? "text-[var(--overlay-strong)]" : "text-[var(--primary)]"}`}>
        {phoneme.category}
      </span>
      <span className={`flex-1 text-sm ${isSelected ? "text-[var(--overlay-darker)]" : "text-[var(--text-secondary)]"}`}>
        {phoneme.name}
      </span>
      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${isSelected ? "bg-[var(--overlay-light)] text-[var(--on-primary)]" : "bg-[var(--btn-regular-bg)] text-[var(--primary)]"}`}>
        {phoneme.example}
      </span>
      <span
        role="button"
        onClick={onPlay}
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-tiny ${isSelected ? "bg-[var(--overlay-light)] text-[var(--on-primary)]" : "bg-[var(--btn-regular-bg)] text-[var(--primary)]"}`}
      >
        {isPlaying ? "■" : "▶"}
      </span>
    </Button>
  );
}
