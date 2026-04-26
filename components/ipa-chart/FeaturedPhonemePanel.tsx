"use client";

import Button from "@/components/ui/Button";
import { Play, Square } from "lucide-react";
import type { PhonemeData } from "./data";

export default function FeaturedPhonemePanel({
  phoneme,
  isPlaying,
  onPlay,
}: {
  phoneme: PhonemeData;
  isPlaying: boolean;
  onPlay: () => void;
  typeMeta?: { light: string; text: string };
}) {
  return (
    <div
      className="rounded-3xl p-6 shadow-sm border"
      style={{
        backgroundColor: "var(--card-bg)",
        borderColor: "var(--line-divider)",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>
          Selected Phoneme
        </p>
        <span
          className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
          style={{ backgroundColor: "var(--btn-regular-bg)", color: "var(--primary)" }}
        >
          {phoneme.type}
        </span>
      </div>

      <div className="flex items-center gap-3 mb-1">
        <span className="text-5xl font-serif leading-none" style={{ color: "var(--text-primary)" }}>
          {phoneme.symbol}
        </span>
        <Button
          onClick={onPlay}
          disabled={!phoneme.rawSymbol}
          variant="primary"
          size="iconLg"
          icon={isPlaying ? <Square size={14} /> : <Play size={14} />}
          className="w-10 h-10 text-white"
        />
      </div>

      <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--primary)" }}>
        {phoneme.name} · {phoneme.category}
      </p>

      <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--text-secondary)" }}>
        {phoneme.description}
      </p>

      <div
        className="rounded-2xl p-3 mb-1"
        style={{ backgroundColor: "var(--btn-regular-bg)" }}
      >
        <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-secondary)" }}>
          Example word
        </p>
        <p className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
          "{phoneme.example}"
        </p>
      </div>

      <ul className="mt-3 space-y-1.5">
        {phoneme.tips.map((tip, index) => (
          <li key={index} className="flex items-start gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
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
