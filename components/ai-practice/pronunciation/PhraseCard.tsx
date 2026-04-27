"use client";

import { Loader2 } from "lucide-react";
import type { WordIPA } from "./types";

interface PhraseCardProps {
  phrase: string;
  wordIPAs: WordIPA[];
  ipaLoading: boolean;
  analyzing: boolean;
  hasAnalysis: boolean;
  hasMistakes: boolean;
}

export default function PhraseCard({
  phrase,
  wordIPAs,
  ipaLoading,
  analyzing,
  hasAnalysis,
  hasMistakes,
}: PhraseCardProps) {
  return (
    <div
      className="w-full max-w-lg px-10 py-8 rounded-3xl text-center"
      style={{
        backgroundColor: "var(--card-bg)",
        boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
        border: "1px solid var(--line-divider)",
      }}
    >
      {/* Decorative opening quote */}
      <div
        className="text-5xl font-serif leading-none mb-2 text-left"
        style={{ color: "var(--primary)", opacity: 0.7, fontFamily: "Georgia, serif" }}
      >
        &ldquo;
      </div>

      <p
        className="text-2xl leading-snug font-semibold"
        style={{
          fontFamily: "var(--font-serif, 'DM Serif Display', serif)",
          color: "var(--text-primary)",
        }}
      >
        {phrase}
        <span
          className="ml-1 text-5xl font-serif leading-none align-bottom"
          style={{ color: "var(--primary)", opacity: 0.7, fontFamily: "Georgia, serif" }}
        >
          &rdquo;
        </span>
      </p>

      {ipaLoading ? (
        <div className="mt-4 flex justify-center">
          <Loader2 size={13} className="animate-spin" style={{ color: "var(--text-tertiary)" }} />
        </div>
      ) : wordIPAs.length > 0 && (
        <div className="mt-4 flex flex-wrap justify-center gap-x-2 gap-y-1">
          {wordIPAs.map((entry, i) => {
            const hasError = entry.alignment?.some(a => a.status !== "correct");
            const allCorrect = hasAnalysis && entry.alignment?.every(a => a.status === "correct");
            return (
              <span
                key={i}
                className="text-sm font-mono transition-colors"
                style={{
                  color: hasAnalysis
                    ? hasError ? "#ef4444"
                    : allCorrect ? "#22c55e"
                    : "var(--text-tertiary)"
                    : "var(--text-tertiary)",
                }}
              >
                {entry.ipa ? `/${entry.ipa}/` : entry.word}
              </span>
            );
          })}
        </div>
      )}

      {analyzing && (
        <div className="mt-3 flex items-center justify-center gap-1.5" style={{ color: "var(--text-tertiary)" }}>
          <Loader2 size={12} className="animate-spin" />
          <span className="text-xs">Analyzing…</span>
        </div>
      )}

      {hasAnalysis && !hasMistakes && (
        <p className="mt-3 text-sm font-semibold" style={{ color: "#22c55e" }}>
          Perfect! 🎉
        </p>
      )}
    </div>
  );
}
