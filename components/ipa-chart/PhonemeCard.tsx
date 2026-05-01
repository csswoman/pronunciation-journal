"use client";

import type { MouseEvent } from "react";
import { IPA_EXTRA } from "@/lib/ipa-data";
import type { PhonemeData } from "./data";

const DIFFICULTY_COLOR: Record<string, string> = {
  easy: "#22c55e",
  medium: "#eab308",
  hard: "#ef4444",
};

const TYPE_BADGE: Record<PhonemeData["type"], { bg: string; label: string }> = {
  vowel: { bg: "#3b82f6", label: "VOWEL" },
  consonant: { bg: "#8b5cf6", label: "CONSONANT" },
  diphthong: { bg: "#10b981", label: "DIPHTHONG" },
};

export default function PhonemeCard({
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
  const extra = IPA_EXTRA[phoneme.symbol];
  const difficultyColor = extra ? DIFFICULTY_COLOR[extra.difficulty] : "#22c55e";
  const typeBadge = TYPE_BADGE[phoneme.type];

  return (
    <button
      type="button"
      onClick={onSelect}
      className="group relative w-full text-left rounded-2xl p-4 border transition-all duration-200 hover:scale-[1.02] focus:outline-none"
      style={{
        backgroundColor: isSelected ? "var(--primary)" : "var(--card-bg)",
        borderColor: isSelected ? "var(--primary)" : "var(--line-divider)",
        color: isSelected ? "white" : "var(--text-primary)",
      }}
    >
      <span
        className="absolute top-2 left-2 w-2 h-2 rounded-full"
        style={{ backgroundColor: difficultyColor, opacity: isSelected ? 0.75 : 1 }}
      />

      <span
        className="text-[8px] uppercase font-bold px-1.5 py-0.5 rounded-full block w-fit mb-1"
        style={
          isSelected
            ? { backgroundColor: "rgba(255,255,255,0.2)", color: "white" }
            : { backgroundColor: typeBadge.bg, color: "white" }
        }
      >
        {typeBadge.label}
      </span>

      <span className="text-2xl font-bold font-ipa block mb-1" style={{ color: isSelected ? "white" : "var(--text-primary)" }}>
        {phoneme.symbol}
      </span>
      <span className="text-[10px] font-bold uppercase tracking-wider block mb-2" style={{ color: isSelected ? "rgba(255,255,255,0.6)" : "var(--primary)" }}>
        {phoneme.category}
      </span>
      <span className="text-xs font-medium" style={{ color: isSelected ? "rgba(255,255,255,0.5)" : "var(--text-secondary)" }}>
        {phoneme.example}
      </span>

      {isPlaying && (
        <span className="absolute bottom-2 right-2 flex gap-0.5 items-end">
          <span className="w-0.5 h-2 rounded-full animate-bounce bg-current" style={{ animationDelay: "0ms" }} />
          <span className="w-0.5 h-3 rounded-full animate-bounce bg-current" style={{ animationDelay: "100ms" }} />
          <span className="w-0.5 h-2 rounded-full animate-bounce bg-current" style={{ animationDelay: "200ms" }} />
        </span>
      )}

      <span
        role="button"
        aria-label={`Hear "${phoneme.example}"`}
        onClick={onPlay}
        className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] transition-opacity duration-150 opacity-0 group-hover:opacity-100"
        style={{
          backgroundColor: isSelected ? "rgba(255,255,255,0.2)" : "var(--btn-regular-bg)",
          color: isSelected ? "white" : "var(--primary)",
        }}
      >
        ▶
      </span>
    </button>
  );
}
