"use client";

import { useState } from "react";
import { Volume2 } from "@/components/icons";

const STATUS_STYLES = {
  correct: "text-[var(--word-correct)] bg-[var(--word-correct-bg)]",
  incorrect: "text-[var(--word-incorrect)] bg-[var(--word-incorrect-bg)]",
  missing: "text-[var(--word-missing)] bg-[var(--word-missing-bg)]",
  extra: "text-[var(--word-extra)] bg-[var(--word-extra-bg)]",
} as const;

interface Props {
  word: string;
  status: "correct" | "incorrect" | "missing" | "extra";
  tip?: string;
  onPlay?: () => void;
}

export function WordChip({ word, status, tip, onPlay }: Props) {
  const [show, setShow] = useState(false);
  const isPlayable = onPlay && (status === "incorrect" || status === "missing");

  return (
    <span
      className="relative inline-flex items-center gap-0.5"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {isPlayable ? (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onPlay?.(); }}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition-opacity cursor-pointer hover:opacity-75 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 border-none ${STATUS_STYLES[status]} ${tip ? "underline decoration-dotted underline-offset-2" : ""}`}
          aria-label={`Listen to "${word}"`}
        >
          {word}
          <Volume2 size={10} className="flex-shrink-0 opacity-60" aria-hidden />
        </button>
      ) : (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLES[status]} ${tip ? "underline decoration-dotted underline-offset-2" : ""}`}
        >
          {word}
        </span>
      )}
      {show && tip && (
        <span
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap z-30 shadow-xl pointer-events-none bg-surface-raised border border-border-subtle text-fg"
        >
          {tip}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[var(--line-divider)]" />
          <span className="absolute top-full left-1/2 -translate-x-1/2 mt-px border-4 border-transparent border-t-[var(--card-bg)]" />
        </span>
      )}
    </span>
  );
}
