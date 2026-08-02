"use client";

import { Check, Play, Square, X } from "@/components/icons";
import { cn } from "@/lib/cn";

type Verdict = "correct" | "wrong" | null;
type Side = "A" | "B";

export function WordCard({
  word,
  symbol,
  side,
  isPlaying,
  highlight,
  selectable,
  compact = false,
  workspace = false,
  onPlay,
  onPick,
}: {
  word: string;
  symbol: string;
  side: Side;
  isPlaying: boolean;
  highlight: Verdict;
  selectable: boolean;
  compact?: boolean;
  workspace?: boolean;
  onPlay: () => void;
  onPick: () => void;
}) {
  const isCorrect = highlight === "correct";
  const isWrong = highlight === "wrong";

  return (
    <button
      type="button"
      onClick={selectable ? onPick : onPlay}
      className={cn(
        "ipa-chart__mpcard",
        compact && "sound-detail__mpcard",
        compact && "sound-detail__pairs-practice-card",
        workspace && "sound-lab__pair-card",
        isCorrect && "ipa-chart__mpcard--correct",
        isWrong && "ipa-chart__mpcard--wrong",
      )}
      aria-label={`${side}: ${word}, ${symbol}`}
    >
      <span className="ipa-chart__mpcard-lab">{compact || workspace ? side : `Opción ${side}`}</span>
      <span className="ipa-chart__mpcard-sym">{symbol}</span>
      <span className="ipa-chart__mpcard-word">{word}</span>
      <span className="ipa-chart__mpcard-play" aria-hidden>
        {isPlaying ? (
          <Square size={14} fill="currentColor" />
        ) : (
          <Play size={14} fill="currentColor" />
        )}
      </span>
      {isCorrect ? (
        <span
          className="absolute right-3 top-3 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--success)] text-[var(--on-success,white)] animate-chip-appear"
          aria-label="Correcto"
        >
          <Check size={13} strokeWidth={3} />
        </span>
      ) : null}
      {isWrong ? (
        <span
          className="absolute right-3 top-3 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--error)] text-[var(--on-error,white)] animate-chip-appear"
          aria-label="Incorrecto"
        >
          <X size={13} strokeWidth={3} />
        </span>
      ) : null}
    </button>
  );
}
