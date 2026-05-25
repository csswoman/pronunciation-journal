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
}: {
  phoneme: PhonemeData;
  keyword: string;
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
        "group relative flex flex-col items-center justify-center w-full h-full min-w-0 rounded-xl border px-1.5 py-3",
        "transition-[background-color,border-color,color,transform,box-shadow] duration-200 ease-out",
        "hover:-translate-y-0.5 hover:shadow-[0_4px_12px_-6px_rgba(0,0,0,0.15)]",
        "active:translate-y-0 active:scale-[0.98]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
      )}
      style={{
        backgroundColor: isSelected ? "var(--text-primary)" : "var(--card-bg)",
        borderColor: isSelected
          ? "var(--text-primary)"
          : isExplored
          ? "color-mix(in oklch, var(--success) 35%, var(--line-divider))"
          : "var(--line-divider)",
        color: isSelected ? "var(--card-bg)" : "var(--text-primary)",
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.borderColor = "var(--border-strong)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.borderColor = isExplored
            ? "color-mix(in oklch, var(--success) 35%, var(--line-divider))"
            : "var(--line-divider)";
        }
      }}
    >
      {isExplored && !isSelected && !isPlaying && (
        <span
          className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: "var(--success)" }}
          aria-label="Explored"
        />
      )}

      {isPlaying && (
        <span
          className="absolute top-1.5 right-1.5 flex items-end gap-1 h-3"
          aria-label="Playing"
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1 rounded-full origin-bottom"
              style={{
                backgroundColor: isSelected ? "var(--card-bg)" : "var(--primary)",
                animation: `wavePulse 0.9s ease-in-out ${i * 0.12}s infinite`,
                height: "100%",
              }}
            />
          ))}
        </span>
      )}

      <span className="font-serif text-2xl leading-none font-medium">
        {phoneme.rawSymbol}
      </span>
      <span
        className="mt-1.5 max-w-full text-[10px] font-semibold uppercase tracking-wider text-center leading-tight break-words transition-opacity"
        style={{
          color: isSelected ? "var(--card-bg)" : "var(--text-secondary)",
          opacity: isSelected ? 0.7 : 1,
        }}
      >
        {keyword}
      </span>
    </button>
  );
}
