"use client";

import { Check, Play, Square, X } from "@/components/icons";
import { PhoneticWordHighlight } from "@/components/pronunciation/PhoneticWordHighlight";
import { getWordTranslation } from "@/lib/sounds/minimal-pairs";
import { cn } from "@/lib/cn";

type Verdict = "correct" | "wrong" | null;
type Side = "A" | "B";

// Sub-components: PhoneticWordHighlight, correct/wrong status badge, play/pause indicator
export function WordCard({
  word,
  symbol,
  side,
  isPlaying,
  highlight,
  selectable,
  compact = false,
  workspace = false,
  selected = false,
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
  selected?: boolean;
  onPlay: () => void;
  onPick: () => void;
}) {
  const isCorrect = highlight === "correct";
  const isWrong = highlight === "wrong";
  const translation = getWordTranslation(word);

  if (workspace && !compact) {
    return (
      <div
        onClick={selectable ? onPick : onPlay}
        className={cn(
          "relative flex flex-col justify-between p-4 md:p-5 rounded-2xl transition-all cursor-pointer select-none min-h-[140px]",
          selected
            ? "bg-white border-2 border-ink shadow-xs"
            : "bg-white/60 border border-black/15 hover:border-black/30 hover:bg-white/75",
          isCorrect && "ring-2 ring-success bg-success-soft/30 border-success",
          isWrong && "ring-2 ring-error bg-error-soft/30 border-error"
        )}
        role="button"
        tabIndex={0}
        aria-label={`${side}: ${word}, ${symbol}`}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (selectable) {
              onPick();
            } else {
              onPlay();
            }
          }
        }}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center ts-badge transition-colors shrink-0",
                selected ? "bg-ink text-paper" : "bg-black/10 text-ink"
              )}
            >
              {side}
            </span>

            <span className="font-display font-extrabold text-base md:text-lg text-ink">
              {symbol}
            </span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPlay();
            }}
            className="w-8 h-8 rounded-full bg-butter hover:bg-butter-deep text-ink flex items-center justify-center shadow-xs transition-transform active:scale-90 cursor-pointer shrink-0"
            aria-label={`Escuchar ${word}`}
          >
            {isPlaying ? (
              <Square size={13} fill="currentColor" />
            ) : (
              <Play size={13} fill="currentColor" className="ml-0.5" />
            )}
          </button>
        </div>

        <div className="mt-3">
          <span className="font-display text-2xl md:text-3xl font-extrabold text-ink block tracking-tight">
            <PhoneticWordHighlight word={word} phonemeOrIpa={symbol} />
          </span>
          {translation ? (
            <span className="ts-body-translation text-ink/60 mt-0.5 block">
              {translation}
            </span>
          ) : null}
        </div>

        {isCorrect ? (
          <span
            className="absolute right-3 bottom-3 inline-flex h-6 w-6 items-center justify-center rounded-full bg-success text-on-success animate-chip-appear"
            aria-label="Correcto"
          >
            <Check size={13} strokeWidth={3} />
          </span>
        ) : null}
        {isWrong ? (
          <span
            className="absolute right-3 bottom-3 inline-flex h-6 w-6 items-center justify-center rounded-full bg-error text-on-error animate-chip-appear"
            aria-label="Incorrecto"
          >
            <X size={13} strokeWidth={3} />
          </span>
        ) : null}
      </div>
    );
  }

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
      <span className="ipa-chart__mpcard-word">
        <PhoneticWordHighlight word={word} phonemeOrIpa={symbol} />
      </span>
      <span className="ipa-chart__mpcard-play" aria-hidden>
        {isPlaying ? (
          <Square size={14} fill="currentColor" />
        ) : (
          <Play size={14} fill="currentColor" />
        )}
      </span>
      {isCorrect ? (
        <span
          className="absolute right-3 top-3 inline-flex h-6 w-6 items-center justify-center rounded-full bg-success text-on-success animate-chip-appear"
          aria-label="Correcto"
        >
          <Check size={13} strokeWidth={3} />
        </span>
      ) : null}
      {isWrong ? (
        <span
          className="absolute right-3 top-3 inline-flex h-6 w-6 items-center justify-center rounded-full bg-error text-on-error animate-chip-appear"
          aria-label="Incorrecto"
        >
          <X size={13} strokeWidth={3} />
        </span>
      ) : null}
    </button>
  );
}
