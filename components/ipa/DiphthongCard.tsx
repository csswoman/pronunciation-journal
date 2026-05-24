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
  onSelect,
}: {
  phoneme: PhonemeData;
  keyword: string;
  glide: DiphthongGlide;
  isSelected: boolean;
  isExplored: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "relative flex flex-col items-center w-full rounded-2xl border px-4 pt-5 pb-3 transition-all duration-150",
        "hover:scale-[1.02] hover:shadow-sm focus:outline-none focus:ring-2"
      )}
      style={{
        backgroundColor: isSelected
          ? "var(--primary-soft, var(--btn-regular-bg))"
          : "var(--card-bg)",
        borderColor: isSelected ? "var(--primary)" : "var(--line-divider)",
      }}
    >
      {isExplored && !isSelected && (
        <span
          className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: "var(--success)" }}
          aria-label="Explored"
        />
      )}

      <span
        className="font-serif text-3xl leading-none mb-2"
        style={{ color: "var(--text-primary)" }}
      >
        {phoneme.symbol.replace(/\//g, "")}
      </span>

      <div className="w-full max-w-[180px] mb-1.5">
        <VowelTrapezoid glide={glide} highlighted={isSelected} />
      </div>

      <span
        className="text-tiny font-semibold uppercase tracking-widest"
        style={{ color: "var(--text-tertiary)" }}
      >
        {keyword}
      </span>
    </button>
  );
}
