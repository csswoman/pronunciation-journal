"use client";

import { Loader2, Play, Turtle } from "lucide-react";
import type { WordIPA } from "./types";

interface Props {
  phrase: string;
  wordIPAs: WordIPA[];
  ipaLoading: boolean;
  analyzing: boolean;
  hasAnalysis: boolean;
  hasMistakes: boolean;
  onListen: () => void;
  onSlow: () => void;
}

export default function PhraseCard({
  phrase,
  wordIPAs,
  ipaLoading,
  analyzing,
  hasAnalysis,
  hasMistakes,
  onListen,
  onSlow,
}: Props) {
  return (
    <div className="flex-1 mx-5 flex flex-col justify-center min-h-0 py-6">

      {/* Phrase */}
      <p className="text-center font-bold leading-snug text-fg" style={{ fontSize: "clamp(22px, 5vw, 28px)" }}>
        {phrase}
      </p>

      {/* Phonetics */}
      {ipaLoading ? (
        <div className="flex justify-center mt-4">
          <Loader2 size={13} className="animate-spin text-fg-subtle" />
        </div>
      ) : wordIPAs.length > 0 ? (
        <div className="flex flex-wrap justify-center gap-x-2 gap-y-1 mt-4">
          {wordIPAs.map((entry, i) => {
            const hasError = entry.alignment?.some(a => a.status !== "correct");
            const allCorrect = hasAnalysis && entry.alignment?.every(a => a.status === "correct");
            return (
              <span
                key={i}
                className="text-sm font-mono tracking-wide transition-colors"
                style={{
                  color: hasAnalysis
                    ? hasError ? "var(--score-poor)"
                    : allCorrect ? "var(--score-excellent)"
                    : "var(--text-secondary)"
                    : "var(--text-secondary)",
                }}
              >
                {entry.ipa ? `/${entry.ipa}/` : entry.word}
              </span>
            );
          })}
        </div>
      ) : null}

      {analyzing && (
        <div className="flex items-center justify-center gap-1.5 text-fg-subtle mt-3">
          <Loader2 size={12} className="animate-spin" />
          <span className="text-caption">Analyzing…</span>
        </div>
      )}

      {hasAnalysis && !hasMistakes && !analyzing && (
        <p className="text-center text-sm font-semibold text-score-excellent mt-3">Perfect! 🎉</p>
      )}

      {/* Listen / Slow */}
      <div className="flex justify-center gap-2 mt-5">
        <button
          onClick={onListen}
          className="flex items-center gap-1.5 bg-primary text-on-primary font-medium text-sm rounded-[10px] px-5 py-2 hover:brightness-110 transition-[filter] cursor-pointer border-none"
        >
          <Play size={14} />
          Listen
        </button>
        <button
          onClick={onSlow}
          className="flex items-center gap-1.5 bg-surface-raised text-fg-muted font-medium text-sm rounded-[10px] px-5 py-2 hover:text-primary transition-colors cursor-pointer border-none"
        >
          <Turtle size={14} />
          Slow
        </button>
      </div>
    </div>
  );
}
