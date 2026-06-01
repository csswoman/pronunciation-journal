"use client";

import { cn } from "@/lib/cn";
import type { PhonemeData, DiphthongGlide } from "./data";
import VowelTrapezoid from "./VowelTrapezoid";

export default function DiphthongCard({
  phoneme,
  keyword,
  glide,
  isSelected,
  isExplored,
  isPlaying,
  onSelect,
}: {
  phoneme: PhonemeData;
  keyword: string;
  glide: DiphthongGlide;
  isSelected: boolean;
  isExplored: boolean;
  isPlaying: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "ipa-chart__ph ipa-chart__ph--diph",
        isSelected && "ipa-chart__ph--sel",
        isExplored && !isSelected && "ipa-chart__ph--explored"
      )}
      style={{ minHeight: "auto", padding: "16px 12px 12px" }}
      aria-pressed={isSelected}
    >
      {isExplored && !isSelected && !isPlaying && (
        <span className="ipa-chart__ph-dot" aria-label="Explorado" />
      )}

      {isPlaying && (
        <span className="ipa-chart__ph-waves" aria-label="Reproduciendo">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{ animationDelay: `${i * 0.12}s`, height: "100%" }}
            />
          ))}
        </span>
      )}

      <span className="ipa-chart__ph-sym" style={{ fontSize: "1.75rem" }}>
        {phoneme.symbol.replace(/\//g, "")}
      </span>

      <div className="w-full max-w-[180px] my-2">
        <VowelTrapezoid glide={glide} highlighted={isSelected} animating={isPlaying} />
      </div>

      <span className="ipa-chart__ph-word">{keyword}</span>
    </button>
  );
}
