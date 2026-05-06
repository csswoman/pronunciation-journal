"use client";

import type { MouseEvent } from "react";
import { IPA_EXTRA } from "@/lib/ipa-data";
import type { PhonemeData } from "./data";
import DifficultyPill from "./DifficultyPill";

const TYPE_LABEL: Record<PhonemeData["type"], string> = {
  vowel: "VOWEL",
  consonant: "CONSONANT",
  diphthong: "DIPHTHONG",
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

  return (
    <button
      type="button"
      onClick={onSelect}
      className="group relative w-full text-left rounded-2xl p-4 border transition-all duration-200 hover:scale-[1.02] focus:outline-none"
      style={{
        backgroundColor: isSelected ? "var(--primary)" : "var(--card-bg)",
        borderColor: isSelected ? "var(--primary)" : "var(--line-divider)",
        color: isSelected ? "var(--on-primary)" : "var(--text-primary)",
      }}
    >
      <span className="block w-fit mb-1">
        {extra ? (
          <DifficultyPill
            difficulty={extra.difficulty}
            label={TYPE_LABEL[phoneme.type]}
            muted={isSelected}
          />
        ) : (
          <span
            className="text-tiny uppercase font-bold px-1.5 py-0.5 rounded-full"
            style={{ backgroundColor: "var(--overlay-light)", color: "var(--on-primary)" }}
          >
            {TYPE_LABEL[phoneme.type]}
          </span>
        )}
      </span>

      <span className="text-2xl font-bold font-ipa block mb-1" style={{ color: isSelected ? "var(--on-primary)" : "var(--text-primary)" }}>
        {phoneme.symbol}
      </span>
      <span className="text-tiny font-bold uppercase tracking-wider block mb-2" style={{ color: isSelected ? "var(--overlay-strong)" : "var(--primary)" }}>
        {phoneme.category}
      </span>
      <span className="text-xs font-medium" style={{ color: isSelected ? "var(--overlay-medium)" : "var(--text-secondary)" }}>
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
        className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-tiny transition-opacity duration-150 opacity-0 group-hover:opacity-100"
        style={{
          backgroundColor: isSelected ? "var(--overlay-light)" : "var(--btn-regular-bg)",
          color: isSelected ? "var(--on-primary)" : "var(--primary)",
        }}
      >
        ▶
      </span>
    </button>
  );
}
