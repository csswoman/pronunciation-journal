"use client";

// Planned structure:
// <IPAMatrixCell>
//   <PlayingWavesIndicator />
//   <CellBody>
//     <PhonemeSymbol />
//     <PhonemeKeyword />
//   </CellBody>
// </IPAMatrixCell>

import { cn } from "@/lib/cn";
import type { PhonemeData } from "./data";

export default function IPAMatrixCell({
  phoneme,
  keyword,
  isSelected,
  isExplored,
  isPlaying,
  onSelect,
  variant = "matrix",
}: {
  phoneme: PhonemeData;
  keyword: string;
  isSelected: boolean;
  isExplored: boolean;
  isPlaying: boolean;
  onSelect: () => void;
  /** tile = celda en grid agrupado (consonantes); matrix = celda en matriz de vocales */
  variant?: "matrix" | "tile";
}) {
  const displaySymbol =
    variant === "tile" ? phoneme.symbol.replace(/\//g, "") : phoneme.rawSymbol;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "ipa-chart__ph flex flex-col items-center justify-center p-3 md:p-4 rounded-2xl transition-all cursor-pointer min-h-[72px] md:min-h-[82px] border border-transparent w-full",
        variant === "tile" && "ipa-chart__ph--tile min-h-[72px]",
        // State 1: Selected ("abierto") -> dark black / ink background with white text
        isSelected &&
          "ipa-chart__ph--sel bg-[var(--ink)] dark:bg-[var(--paper)] text-[var(--paper)] dark:text-[var(--ink)] border-transparent shadow-sm scale-[1.02]",
        // State 2: Explored ("dominado") -> pure mint green background
        isExplored &&
          !isSelected &&
          "ipa-chart__ph--explored bg-[var(--mint)] dark:bg-[var(--mint)]/40 text-[var(--ink)] dark:text-[var(--text)] border-transparent hover:brightness-95",
        // State 3: Unexplored ("por practicar") -> pure lilac purple background
        !isExplored &&
          !isSelected &&
          "bg-[var(--lilac)] dark:bg-[var(--lilac)]/40 text-[var(--ink)] dark:text-[var(--text)] border-transparent hover:brightness-95"
      )}
      aria-pressed={isSelected}
      aria-label={`${phoneme.symbol}, ejemplo ${keyword}`}
    >
      {isPlaying && (
        <span className="ipa-chart__ph-waves" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{ animationDelay: `${i * 0.12}s`, height: "100%" }}
            />
          ))}
        </span>
      )}

      <span className="ipa-chart__ph-body flex flex-col items-center">
        <span className="ipa-chart__ph-sym">
          {displaySymbol}
        </span>
        <span className="ipa-chart__ph-word">
          {keyword}
        </span>
      </span>
    </button>
  );
}
