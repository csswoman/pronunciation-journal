"use client";

import { RotateCcw, Square, Volume2 } from "lucide-react";
import { outlineBtn } from "./interview-utils";

interface Props {
  title: string;
  visibleCount: number;
  totalTurns: number;
  speechSupported: boolean;
  isPlayingAll: boolean;
  onPlayAll: () => void;
  onReset: () => void;
}

export function InterviewTopBar({
  title, visibleCount, totalTurns, speechSupported, isPlayingAll, onPlayAll, onReset,
}: Props) {
  const progress = Math.round((visibleCount / totalTurns) * 100);

  return (
    <div
      className="flex-shrink-0 px-4 pt-4 pb-3 flex items-center justify-between gap-3 border-b"
      style={{ borderColor: "var(--line-divider)", background: "var(--card-bg)" }}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold truncate" style={{ color: "var(--deep-text)" }}>{title}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <div className="flex-1 h-1.5 rounded-full" style={{ background: "var(--line-divider)" }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, background: "var(--color-accent)" }}
            />
          </div>
          <span className="text-xs flex-shrink-0 tabular-nums" style={{ color: "var(--muted-text)" }}>
            {Math.ceil(visibleCount / 2)}/{Math.ceil(totalTurns / 2)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        {speechSupported && (
          <button
            onClick={onPlayAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all"
            style={isPlayingAll
              ? { borderColor: "var(--color-accent)", color: "var(--color-accent)", background: "color-mix(in oklch, var(--color-accent) 10%, transparent)" }
              : outlineBtn}
          >
            {isPlayingAll ? <><Square size={11} /> Stop</> : <><Volume2 size={11} /> Preview</>}
          </button>
        )}
        <button
          onClick={onReset}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all"
          style={outlineBtn}
        >
          <RotateCcw size={11} /> New
        </button>
      </div>
    </div>
  );
}
