"use client";

// Planned structure:
// <WordCard>
//   <StatusBadge />
//   <WordTitle + PartOfSpeech />
//   <Definition />
//   <CardFooter: DifficultyDots + LearnButton + PlayButton />
// </WordCard>

import { Volume2, Heart, Plus, Check } from "lucide-react";
import { speak } from "@/lib/phoneme-practice/tts";

interface WordCardProps {
  word: string;
  partOfSpeech: string;
  definition: string;
  example?: string;
  status: "learned" | "reviewing" | "new";
  difficulty: number; // 1–5
  color?: string;
  onMarkLearned?: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  isInMyWords?: boolean;
  onAddToMyWords?: () => void;
}

const STATUS_CONFIG = {
  learned: {
    label: "learned",
    icon: "✓",
    badgeClass: "text-primary bg-primary-soft border-border-default",
    cardClass: "border-primary/30 bg-primary-soft/30",
    dotColor: "bg-primary",
  },
  reviewing: {
    label: "reviewing",
    icon: "↺",
    badgeClass: "text-warning-value bg-warning-soft border-border-default",
    cardClass: "border-warning/40 bg-warning-soft/20",
    dotColor: "bg-warning",
  },
  new: {
    label: "",
    icon: "",
    badgeClass: "",
    cardClass: "border-border-default bg-surface-raised",
    dotColor: "bg-border-default",
  },
} as const;

export function WordCard({
  word,
  partOfSpeech,
  definition,
  example,
  status,
  difficulty,
  color,
  onMarkLearned,
  isFavorite,
  onToggleFavorite,
  isInMyWords,
  onAddToMyWords,
}: WordCardProps) {
  const cfg = STATUS_CONFIG[status];
  const isLearned = status === "learned";

  return (
    <div className={`flex flex-col gap-2 p-4 rounded-xl border ${cfg.cardClass}`}>
      {status !== "new" && (
        <span className={`self-start text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.badgeClass}`}>
          {cfg.icon} {cfg.label}
        </span>
      )}

      <div>
        <p className="text-xl font-semibold text-fg leading-tight">{word}</p>
        <p className="text-xs text-fg-subtle italic mt-0.5">{partOfSpeech}</p>
      </div>

      <p className="text-sm text-fg-muted leading-snug flex-1">{definition}</p>

      {example && (
        <p
          className="text-[11px] italic text-fg-subtle leading-snug mt-1 pl-2"
          style={{ borderLeft: `2px solid ${color ?? "var(--border-default)"}` }}
        >
          "{example}"
        </p>
      )}

      <div className="flex items-center justify-between mt-1">
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              className={`w-2 h-2 rounded-full ${i < difficulty ? cfg.dotColor : "bg-border-default"}`}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          {!isLearned && (
            <button
              onClick={onMarkLearned}
              disabled={!onMarkLearned}
              className="text-xs text-fg-muted hover:text-fg border border-border-default hover:border-border-strong px-2.5 py-1 rounded-full transition-colors disabled:opacity-40"
            >
              Mark learned
            </button>
          )}
          {onToggleFavorite && (
            <button
              onClick={onToggleFavorite}
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
              className={`p-1.5 rounded-full transition-colors ${
                isFavorite ? "text-error hover:text-error/70" : "text-fg-muted hover:text-fg"
              }`}
            >
              <Heart size={14} fill={isFavorite ? "currentColor" : "none"} />
            </button>
          )}
          {onAddToMyWords && (
            <button
              onClick={isInMyWords ? undefined : onAddToMyWords}
              disabled={isInMyWords}
              aria-label={isInMyWords ? "Already in My Words" : "Add to My Words"}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border transition-colors ${
                isInMyWords
                  ? "text-fg-subtle border-border-subtle opacity-50 cursor-default"
                  : "text-fg-muted border-border-default hover:text-fg hover:border-border-strong"
              }`}
            >
              {isInMyWords ? <Check size={11} /> : <Plus size={11} />}
              {isInMyWords ? "In My Words" : "Add"}
            </button>
          )}
          <button
            onClick={() => {
              const text = [word, definition, example ? `For example: ${example}` : ""]
                .filter(Boolean)
                .join(". ");
              speak(text, 0.9);
            }}
            className="p-1.5 rounded-full text-fg-muted hover:text-fg hover:bg-surface-sunken transition-colors"
            aria-label={`Listen to ${word}`}
          >
            <Volume2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export type { WordCardProps };
