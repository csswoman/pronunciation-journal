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

  return (
    <button
      type="button"
      onClick={selectable ? onPick : onPlay}
      className={cn(
        "ipa-chart__mpcard",
        isCorrect && "ipa-chart__mpcard--correct",
        isWrong && "ipa-chart__mpcard--wrong"
      )}
    >
      <span className="ipa-chart__mpcard-lab">{side}</span>

      <span className="ipa-chart__mpcard-sym">{symbol}</span>
      <span className="ipa-chart__mpcard-word">{word}</span>

      <span className="ipa-chart__mpcard-play" aria-hidden>
        {isPlaying ? (
          <Square size={14} fill="currentColor" />
        ) : (
          <Play size={14} fill="currentColor" />
        )}
      </span>

      {isCorrect && (
        <span
          className="absolute top-3 right-3 inline-flex items-center justify-center w-6 h-6 rounded-full bg-[var(--success)] text-[var(--on-success,white)] animate-chip-appear"
          aria-label="Correcto"
        >
          <Check size={13} strokeWidth={3} />
        </span>
      )}
      {isWrong && (
        <span
          className="absolute top-3 right-3 inline-flex items-center justify-center w-6 h-6 rounded-full bg-[var(--error)] text-[var(--on-error,white)] animate-chip-appear"
          aria-label="Incorrecto"
        >
          <X size={13} strokeWidth={3} />
        </span>
      )}
    </button>
  );
}
