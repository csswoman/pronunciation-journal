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
      className="w-full justify-start items-center gap-4 px-5 py-3 rounded-2xl border text-left transition-all duration-200"
      style={{
        backgroundColor: isSelected ? "var(--primary)" : "var(--card-bg)",
        borderColor: isSelected ? "var(--primary)" : "var(--line-divider)",
        color: isSelected ? "white" : "var(--text-primary)",
      }}
    >
      <span className="text-2xl font-serif font-bold w-16 shrink-0" style={{ color: isSelected ? "white" : "var(--text-primary)" }}>
        {phoneme.symbol}
      </span>
      <span className="text-xs font-bold uppercase tracking-wider w-28 shrink-0" style={{ color: isSelected ? "rgba(255,255,255,0.6)" : "var(--primary)" }}>
        {phoneme.category}
      </span>
      <span className="flex-1 text-sm" style={{ color: isSelected ? "rgba(255,255,255,0.8)" : "var(--text-secondary)" }}>
        {phoneme.name}
      </span>
      <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: isSelected ? "rgba(255,255,255,0.2)" : "var(--btn-regular-bg)", color: isSelected ? "white" : "var(--primary)" }}>
        {phoneme.example}
      </span>
      <span
        role="button"
        onClick={onPlay}
        className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] shrink-0"
        style={{
          backgroundColor: isSelected ? "rgba(255,255,255,0.2)" : "var(--btn-regular-bg)",
          color: isSelected ? "white" : "var(--primary)",
        }}
      >
        {isPlaying ? "■" : "▶"}
      </span>
    </Button>
  );
}
