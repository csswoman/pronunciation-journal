"use client";

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
        "ipa-chart__ph",
        variant === "tile" && "ipa-chart__ph--tile",
        isSelected && "ipa-chart__ph--sel",
        isExplored && !isSelected && "ipa-chart__ph--explored"
      )}
      aria-pressed={isSelected}
      aria-label={`${phoneme.symbol}, ejemplo ${keyword}`}
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

      <span className="ipa-chart__ph-body">
        <span className="ipa-chart__ph-sym">{displaySymbol}</span>
        <span className="ipa-chart__ph-word">{keyword}</span>
      </span>
    </button>
  );
}
