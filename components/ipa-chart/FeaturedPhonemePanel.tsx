"use client";

import Button from "@/components/ui/Button";
import { Play, Square } from "lucide-react";
import { IPA_EXTRA } from "@/lib/ipa-data";
import type { PhonemeData } from "./data";

const DIFFICULTY_CONFIG = {
  easy:   { label: "Easy",   color: "#22c55e", filled: 2 },
  medium: { label: "Moderate", color: "#eab308", filled: 3 },
  hard:   { label: "Hard",   color: "#ef4444", filled: 5 },
};

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
  const extra = IPA_EXTRA[phoneme.symbol];
  const diffConfig = extra ? DIFFICULTY_CONFIG[extra.difficulty] : null;

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

      {diffConfig && (
        <div className="mt-4 pt-4 border-t" style={{ borderColor: "var(--line-divider)" }}>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>
              Difficulty
            </p>
            <span className="text-[10px] font-bold uppercase" style={{ color: diffConfig.color }}>
              {diffConfig.label}
            </span>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <span
                key={i}
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: i < diffConfig.filled ? diffConfig.color : "var(--line-divider)",
                }}
              />
            ))}
          </div>
        </div>
      )}

      {extra?.articulation && extra.articulation.length > 0 && (
        <div className="mt-4 pt-4 border-t" style={{ borderColor: "var(--line-divider)" }}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-secondary)" }}>
            Articulation
          </p>
          <ul className="space-y-1.5">
            {extra.articulation.map((point, i) => (
              <li key={i} className="flex items-start gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
                <span className="mt-0.5 shrink-0" style={{ color: "var(--primary)" }}>▸</span>
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}

      {extra?.minimalPairs && extra.minimalPairs.length > 0 && (
        <div className="mt-4 pt-4 border-t" style={{ borderColor: "var(--line-divider)" }}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-secondary)" }}>
            Minimal Pairs
          </p>
          <ul className="space-y-1.5">
            {extra.minimalPairs.map((pair, i) => (
              <li key={i} className="text-xs" style={{ color: "var(--text-secondary)" }}>
                <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{pair.wordA}</span>
                <span className="mx-1">vs</span>
                <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{pair.wordB}</span>
                <span className="ml-1 opacity-60">({pair.phonemeA} vs {pair.phonemeB})</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {extra?.spanishTip && (
        <div
          className="mt-4 rounded-2xl p-4 flex gap-3"
          style={{ backgroundColor: "var(--admonitions-color-tip-bg, rgba(234,179,8,0.1))" }}
        >
          <span className="text-lg shrink-0 mt-0.5">💡</span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "#eab308" }}>
              Para hispanohablantes
            </p>
            <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {extra.spanishTip}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
