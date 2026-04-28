"use client";

import { useState } from "react";
import { Volume2 } from "lucide-react";

const colors = { correct: "#16a34a", incorrect: "#dc2626", missing: "#d97706", extra: "#6b7280" };
const bgs    = { correct: "#16a34a18", incorrect: "#dc262618", missing: "#d9770618", extra: "#6b728018" };

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
      <span
        onClick={isPlayable ? (e) => { e.stopPropagation(); onPlay?.(); } : undefined}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition-opacity
          ${tip ? "underline decoration-dotted underline-offset-2" : ""}
          ${isPlayable ? "cursor-pointer hover:opacity-75 active:scale-95" : ""}
        `}
        style={{ color: colors[status], background: bgs[status] }}
        title={isPlayable ? `Listen to "${word}"` : undefined}
      >
        {word}
        {isPlayable && <Volume2 size={10} className="flex-shrink-0 opacity-60" />}
      </span>
      {show && tip && (
        <span
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap z-30 shadow-xl pointer-events-none"
          style={{ background: "var(--card-bg)", border: "1px solid var(--line-divider)", color: "var(--body-text)" }}
        >
          {tip}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent"
            style={{ borderTopColor: "var(--line-divider)" }} />
          <span className="absolute top-full left-1/2 -translate-x-1/2 mt-px border-[4px] border-transparent"
            style={{ borderTopColor: "var(--card-bg)" }} />
        </span>
      )}
    </span>
  );
}
