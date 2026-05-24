"use client";

import { cn } from "@/lib/cn";
import type { PhonemeData } from "./data";

export default function IPAMatrixCell({
  phoneme,
  keyword,
  isSelected,
  isExplored,
  onSelect,
}: {
  phoneme: PhonemeData;
  keyword: string;
  isSelected: boolean;
  isExplored: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "relative flex flex-col items-center justify-center w-full h-full min-w-0 rounded-xl border px-1.5 py-3 transition-all duration-150",
        "hover:scale-[1.03] hover:shadow-sm focus:outline-none focus:ring-2"
      )}
      style={{
        backgroundColor: isSelected ? "var(--text-primary)" : "var(--card-bg)",
        borderColor: isSelected ? "var(--text-primary)" : "var(--line-divider)",
        color: isSelected ? "var(--card-bg)" : "var(--text-primary)",
      }}
    >
      {isExplored && !isSelected && (
        <span
          className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: "var(--success)" }}
          aria-label="Explored"
        />
      )}

      <span className="font-serif text-2xl leading-none font-medium">
        {phoneme.rawSymbol}
      </span>
      <span
        className="mt-1.5 max-w-full text-[10px] font-semibold uppercase tracking-wider text-center leading-tight break-words"
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
