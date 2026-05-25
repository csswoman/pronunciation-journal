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
        "group relative flex flex-col items-center w-full rounded-2xl border px-4 pt-5 pb-3",
        "transition-[background-color,border-color,transform,box-shadow] duration-200 ease-out",
        "hover:-translate-y-0.5 hover:shadow-[0_6px_16px_-8px_rgba(0,0,0,0.18)]",
        "active:translate-y-0 active:scale-[0.99]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
      )}
      style={{
        backgroundColor: isSelected
          ? "var(--primary-soft, var(--btn-regular-bg))"
          : "var(--card-bg)",
        borderColor: isSelected
          ? "var(--primary)"
          : isExplored
          ? "color-mix(in oklch, var(--success) 35%, var(--line-divider))"
          : "var(--line-divider)",
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
          className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: "var(--success)" }}
          aria-label="Explored"
        />
      )}

      {isPlaying && (
        <span
          className="absolute top-2.5 right-2.5 flex items-end gap-[2px] h-3"
          aria-label="Playing"
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-[2px] rounded-full origin-bottom"
              style={{
                backgroundColor: "var(--primary)",
                animation: `wavePulse 0.9s ease-in-out ${i * 0.12}s infinite`,
                height: "100%",
              }}
            />
          ))}
        </span>
      )}

      <span
        className="font-serif text-3xl leading-none mb-2"
        style={{ color: "var(--text-primary)" }}
      >
        {phoneme.symbol.replace(/\//g, "")}
      </span>

      <div className="w-full max-w-[180px] mb-1.5">
        <VowelTrapezoid glide={glide} highlighted={isSelected} animating={isPlaying} />
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
