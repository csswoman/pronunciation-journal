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
      className="w-full max-w-sm px-8 py-6 rounded-2xl border-2 border-dashed text-center"
      style={{ borderColor: "var(--line-divider)" }}
    >
      <p
        className="text-xl leading-snug"
        style={{
          fontFamily: "var(--font-serif, 'DM Serif Display', serif)",
          color: "var(--text-primary)",
        }}
      >
        &ldquo;{phrase}&rdquo;
      </p>

      {ipaLoading ? (
        <div className="mt-3 flex justify-center">
          <Loader2 size={12} className="animate-spin" style={{ color: "var(--text-tertiary)" }} />
        </div>
      ) : wordIPAs.length > 0 && (
        <div className="mt-3 flex flex-wrap justify-center gap-x-2 gap-y-1">
          {wordIPAs.map((entry, i) => {
            const hasError = entry.alignment?.some(a => a.status !== "correct");
            const allCorrect = hasAnalysis && entry.alignment?.every(a => a.status === "correct");
            return (
              <span
                key={i}
                className="text-xs font-mono transition-colors"
                style={{
                  color: hasAnalysis
                    ? hasError ? "#ef4444" : allCorrect ? "#22c55e" : "var(--text-tertiary)"
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
          <Loader2 size={11} className="animate-spin" />
          <span className="text-xs">Analyzing…</span>
        </div>
      )}

      {hasAnalysis && !hasMistakes && (
        <p className="mt-3 text-xs font-semibold" style={{ color: "#22c55e" }}>
          Perfect! 🎉
        </p>
      )}
    </div>
  );
}
