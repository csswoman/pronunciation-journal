"use client";

import { Loader2, Play, PartyPopper } from "lucide-react";
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
    <div className="flex flex-col items-center justify-center text-center px-6 py-8 flex-1">

      <h1
        className="leading-snug font-medium mb-5"
        style={{
          fontFamily: "'Georgia', 'Times New Roman', serif",
          fontSize: "clamp(22px, 6vw, 34px)",
          letterSpacing: "-0.02em",
          color: "var(--fg)",
        }}
      >
        {phrase}
      </h1>

      {ipaLoading ? (
        <div className="flex justify-center mb-4">
          <Loader2 size={13} className="animate-spin" style={{ color: "var(--text-tertiary)" }} />
        </div>
      ) : wordIPAs.length > 0 ? (
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-1.5 mb-5 font-mono text-sm">
          {wordIPAs.map((entry, i) => {
            const hasError   = entry.alignment?.some(a => a.status !== "correct");
            const allCorrect = hasAnalysis && entry.alignment?.every(a => a.status === "correct");
            const text = entry.ipa ? `/${entry.ipa}/` : entry.word;

            if (hasAnalysis && hasError) {
              return (
                <span
                  key={i}
                  className="font-medium rounded px-1.5 py-0.5"
                  style={{ color: "var(--warning)", backgroundColor: "var(--warning-soft)" }}
                >
                  {text}
                </span>
              );
            }
            if (allCorrect) {
              return (
                <span key={i} style={{ color: "var(--score-excellent)" }}>{text}</span>
              );
            }
            return (
              <span key={i} style={{ color: "var(--text-tertiary)" }}>{text}</span>
            );
          })}
        </div>
      ) : null}

      {analyzing && (
        <div className="flex items-center justify-center gap-1.5 mb-3" style={{ color: "var(--text-tertiary)" }}>
          <Loader2 size={12} className="animate-spin" />
          <span className="text-xs">Analyzing…</span>
        </div>
      )}

      {hasAnalysis && !hasMistakes && !analyzing && (
        <div className="flex items-center gap-1.5 mb-3">
          <PartyPopper size={14} style={{ color: "var(--score-excellent)" }} />
          <p className="text-sm font-semibold" style={{ color: "var(--score-excellent)" }}>Perfect!</p>
        </div>
      )}

      {/* Audio controls pill */}
      <div
        className="inline-flex items-center gap-0.5 rounded-full p-1"
        style={{
          backgroundColor: "var(--btn-regular-bg)",
          border: "1px solid var(--line-divider)",
        }}
      >
        <button
          onClick={onListen}
          className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors cursor-pointer border-none"
          style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}
        >
          <Play size={11} fill="currentColor" />
          Listen
        </button>
        <button
          onClick={onSlow}
          className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors cursor-pointer border-none text-[color:var(--text-secondary)] hover:bg-[var(--btn-regular-bg)] hover:text-[color:var(--fg)] focus-visible:outline-none focus-visible:ring-2"
          style={{ backgroundColor: "transparent" }}
        >
          0.5×
        </button>
      </div>
    </div>
  );
}
