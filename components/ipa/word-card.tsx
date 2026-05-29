"use client";

import { Play, Square, Check, X } from "lucide-react";
import { cn } from "@/lib/cn";

type Verdict = "correct" | "wrong" | null;
type Side = "A" | "B";

interface WordCardProps {
  word: string;
  symbol: string;
  side: Side;
  isPlaying: boolean;
  highlight: Verdict;
  selectable: boolean;
  onPlay: () => void;
  onPick: () => void;
}

export function WordCard({
  word,
  symbol,
  side,
  isPlaying,
  highlight,
  selectable,
  onPlay,
  onPick,
}: WordCardProps) {
  const isCorrect = highlight === "correct";
  const isWrong = highlight === "wrong";

  const borderClass = isCorrect
    ? "border-[var(--success)] shadow-[0_0_0_3px_color-mix(in_oklch,var(--success)_20%,transparent)]"
    : isWrong
    ? "border-[var(--error)] shadow-[0_0_0_3px_color-mix(in_oklch,var(--error)_20%,transparent)]"
    : "border-[var(--border-default)]";

  const bgClass = isCorrect
    ? "bg-[var(--success-soft)]"
    : isWrong
    ? "bg-[var(--error-soft)]"
    : "bg-[var(--card-bg)]";

  return (
    <button
      type="button"
      onClick={selectable ? onPick : onPlay}
      className={cn(
        "group relative flex-1 min-w-0 flex flex-col items-center justify-center",
        "rounded-2xl border-2 px-6 py-7 min-h-[180px]",
        "transition-[background-color,border-color,transform,box-shadow] duration-200 ease-out",
        "hover:-translate-y-1 hover:shadow-[0_8px_20px_-10px_rgba(0,0,0,0.2)]",
        "active:translate-y-0 active:scale-[0.99]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        borderClass,
        bgClass
      )}
    >
      <span
        className="absolute top-3 left-3 inline-flex items-center justify-center w-5 h-5 rounded-md text-tiny font-bold bg-[var(--btn-regular-bg)] text-[var(--text-tertiary)]"
      >
        {side}
      </span>

      <span className="font-serif text-2xl leading-none mb-3 text-[var(--text-secondary)]">
        {symbol}
      </span>

      <span className="text-3xl font-semibold tracking-tight text-[var(--text-primary)]">
        {word}
      </span>

      <span
        className={cn(
          "absolute bottom-3 right-3 inline-flex items-center justify-center w-8 h-8 rounded-full transition-all",
          isPlaying ? "bg-[var(--primary)]" : "bg-[var(--text-primary)]",
          "text-[var(--card-bg)]"
        )}
        aria-hidden
      >
        {isPlaying ? (
          <Square size={11} fill="currentColor" />
        ) : (
          <Play size={11} fill="currentColor" />
        )}
      </span>

      {isCorrect && (
        <span
          className="absolute top-3 right-3 inline-flex items-center justify-center w-6 h-6 rounded-full bg-[var(--success)] text-white animate-chip-appear"
          aria-label="Correct"
        >
          <Check size={13} strokeWidth={3} />
        </span>
      )}
      {isWrong && (
        <span
          className="absolute top-3 right-3 inline-flex items-center justify-center w-6 h-6 rounded-full bg-[var(--error)] text-white animate-chip-appear"
          aria-label="Wrong"
        >
          <X size={13} strokeWidth={3} />
        </span>
      )}
    </button>
  );
}
