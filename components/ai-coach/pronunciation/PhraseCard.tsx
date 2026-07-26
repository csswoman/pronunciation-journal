"use client";

import { Loader2, Play, PartyPopper } from "@/components/icons";
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
    <div className="flex flex-col items-center justify-center text-center px-[var(--layout-card-pad)] py-[var(--layout-section-gap)] flex-1">

      <h1
        className="mb-5 text-display-word font-medium leading-snug tracking-[-0.02em] text-[var(--fg)]"
      >
        {phrase}
      </h1>

      {ipaLoading ? (
        <div className="flex justify-center mb-4">
          <Loader2 size={13} className="animate-spin text-[var(--text-tertiary)]" />
        </div>
      ) : wordIPAs.length > 0 ? (
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-1.5 mb-5 font-mono text-body-sm">
          {wordIPAs.map((entry, i) => {
            const hasError   = entry.alignment?.some(a => a.status !== "correct");
            const allCorrect = hasAnalysis && entry.alignment?.every(a => a.status === "correct");
            const text = entry.ipa ? `/${entry.ipa}/` : entry.word;

            if (hasAnalysis && hasError) {
              return (
                <span
                  key={i}
                  className="rounded bg-[var(--warning-soft)] px-1.5 py-0.5 font-medium text-[var(--warning)]"
                >
                  {text}
                </span>
              );
            }
            if (allCorrect) {
              return (
                <span key={i} className="text-[var(--score-excellent)]">{text}</span>
              );
            }
            return (
              <span key={i} className="text-[var(--text-tertiary)]">{text}</span>
            );
          })}
        </div>
      ) : null}

      {analyzing && (
        <div className="mb-3 flex items-center justify-center gap-1.5 text-[var(--text-tertiary)]">
          <Loader2 size={12} className="animate-spin" />
          <span className="text-caption">Analyzing…</span>
        </div>
      )}

      {hasAnalysis && !hasMistakes && !analyzing && (
        <div className="flex items-center gap-1.5 mb-3">
          <PartyPopper size={14} className="text-[var(--score-excellent)]" />
          <p className="text-body-sm font-semibold text-[var(--score-excellent)]">Perfect!</p>
        </div>
      )}

      {/* Audio controls pill */}
      <div
        className="inline-flex items-center gap-0.5 rounded-full border border-[var(--line-divider)] bg-[var(--btn-regular-bg)] p-1"
      >
        <button
          onClick={onListen}
          className="inline-flex cursor-pointer items-center gap-2 rounded-full border-none bg-[var(--primary)] px-4 py-1.5 text-body-sm font-medium text-[var(--primary-foreground)] transition-colors"
        >
          <Play size={11} fill="currentColor" />
          Listen
        </button>
        <button
          onClick={onSlow}
          className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-body-sm font-medium transition-colors cursor-pointer border-none text-[color:var(--text-secondary)] hover:bg-[var(--btn-regular-bg)] hover:text-[color:var(--fg)] focus-visible:outline-none focus-visible:ring-2"
        >
          0.5×
        </button>
      </div>
    </div>
  );
}
