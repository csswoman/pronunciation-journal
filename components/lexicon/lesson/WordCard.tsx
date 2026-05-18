"use client";

// Planned structure:
// <WordCard>
//   <StatusBadge />
//   <WordTitle + PartOfSpeech />
//   <Definition />
//   <CardFooter: DifficultyDots + WordBankButton + PlayButton />
// </WordCard>

import { Volume2 } from "lucide-react";
import { speak } from "@/lib/phoneme-practice/tts";

interface WordCardProps {
  word: string;
  partOfSpeech: string;
  definition: string;
  example?: string;
  status: "learned" | "reviewing" | "new";
  difficulty: number; // 1–5
  color?: string;
  onAddToWordBank?: (word: string) => void;
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
    label: "new",
    icon: "◦",
    badgeClass: "text-fg-muted bg-surface-sunken border-border-default",
    cardClass: "border-border-default bg-surface-raised",
    dotColor: "bg-border-default",
  },
} as const;

export function WordCard({ word, partOfSpeech, definition, example, status, difficulty, color, onAddToWordBank }: WordCardProps) {
  const cfg = STATUS_CONFIG[status];

  return (
    <div className={`flex flex-col gap-2 p-4 rounded-xl border ${cfg.cardClass}`}>
      <span className={`self-start text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.badgeClass}`}>
        {cfg.icon} {cfg.label}
      </span>

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
          <button
            onClick={() => onAddToWordBank?.(word)}
            className="text-xs text-fg-muted hover:text-fg border border-border-default hover:border-border-strong px-2.5 py-1 rounded-full transition-colors"
          >
            + Word Bank
          </button>
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
