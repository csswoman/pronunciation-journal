"use client";

import Button from "@/components/ui/Button";
import type { PhonemeData } from "./data";

export default function FeaturedPhonemePanel({
  phoneme,
  isPlaying,
  onPlay,
  typeMeta,
}: {
  phoneme: PhonemeData;
  isPlaying: boolean;
  onPlay: () => void;
  typeMeta: { light: string; text: string };
}) {
  return (
    <div
      className="rounded-3xl p-6 shadow-sm border"
      style={{
        backgroundColor: "var(--card-bg)",
        borderColor: "var(--line-divider)",
      }}
    >
      <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: "var(--text-secondary)" }}>
        Featured Phoneme
      </p>

      <div className="flex items-center gap-4 mb-1">
        <span className="text-6xl font-serif leading-none" style={{ color: "var(--text-primary)" }}>
          {phoneme.symbol}
        </span>
        <Button onClick={onPlay} disabled={!phoneme.rawSymbol} variant="primary" size="iconLg" className="w-12 h-12 text-white text-lg">
          {isPlaying ? "■" : "▶"}
        </Button>
      </div>

      <p className="text-sm font-semibold mb-4" style={{ color: "var(--text-secondary)" }}>
        {phoneme.name}
      </p>

      <div
        className="rounded-2xl h-28 flex items-center justify-center mb-4 overflow-hidden relative"
        style={{ backgroundColor: "var(--btn-regular-bg)" }}
      >
        <span className="text-8xl font-serif select-none leading-none" style={{ color: "var(--primary)", opacity: 0.3 }}>
          {phoneme.symbol}
        </span>
        <span
          className="absolute bottom-2 right-2 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: typeMeta.light,
            color: typeMeta.text,
          }}
        >
          {phoneme.type}
        </span>
      </div>

      <ul className="space-y-2">
        {phoneme.tips.map((tip, index) => (
          <li key={index} className="flex items-start gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
            <span className="mt-0.5 shrink-0" style={{ color: "var(--admonitions-color-tip)" }}>
              ●
            </span>
            {tip}
          </li>
        ))}
      </ul>
    </div>
  );
}
