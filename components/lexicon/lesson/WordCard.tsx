"use client";

import type { CSSProperties } from "react";
import { Volume2, Heart, Plus, Check } from "lucide-react";
import { speak } from "@/lib/phoneme-practice/tts";
import { formatIpaDisplay } from "@/lib/lexicon/format-ipa";
import { cn } from "@/lib/cn";

interface WordCardProps {
  word: string;
  partOfSpeech: string;
  definition: string;
  ipa?: string;
  translation?: string;
  example?: string;
  status: "learned" | "reviewing" | "new";
  difficulty: number;
  view?: "grid" | "list";
  onMarkLearned?: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  isInMyWords?: boolean;
  onAddToMyWords?: () => void;
}

const STATUS_CONFIG = {
  learned: {
    label: "Learned",
    stateColor: "var(--success)",
    strength: 5,
  },
  reviewing: {
    label: "Reviewing",
    stateColor: "var(--warning)",
    strength: 3,
  },
  new: {
    label: "New",
    stateColor: "var(--text-tertiary)",
    strength: 0,
  },
} as const;

export function WordCard({
  word,
  partOfSpeech,
  definition,
  ipa,
  translation,
  example,
  status,
  difficulty,
  view = "grid",
  onMarkLearned,
  isFavorite,
  onToggleFavorite,
  isInMyWords,
  onAddToMyWords,
}: WordCardProps) {
  const cfg = STATUS_CONFIG[status];
  const isLearned = status === "learned";
  const meterStrength = isLearned ? cfg.strength : Math.max(cfg.strength, difficulty);

  return (
    <article
      className={cn("lexicon-area__card", view === "list" && "lexicon-area__card--list")}
      style={{ "--card-state": cfg.stateColor } as CSSProperties}
    >
      <div className="lexicon-area__card-top">
        <div>
          <p className="lexicon-area__card-word">{word}</p>
          {ipa ? (
            <p className="lexicon-area__card-ipa font-ipa">{formatIpaDisplay(ipa)}</p>
          ) : null}
        </div>
        <span
          className="lexicon-area__statepill"
          style={{
            color: cfg.stateColor,
            background: `color-mix(in srgb, ${cfg.stateColor} 14%, transparent)`,
            border: `1px solid color-mix(in srgb, ${cfg.stateColor} 35%, transparent)`,
          }}
        >
          {cfg.label}
        </span>
      </div>

      <div className={cn(view === "list" && "lexicon-area__card-body")}>
        <p className="lexicon-area__card-pos">{partOfSpeech}</p>

        {translation ? <p className="lexicon-area__card-trans">{translation}</p> : null}

        <p className="lexicon-area__card-def">{definition}</p>

        {example ? <p className="lexicon-area__card-example">&ldquo;{example}&rdquo;</p> : null}
      </div>

      <div className="lexicon-area__card-foot">
        <div className="lexicon-area__meter" aria-hidden>
          {Array.from({ length: 5 }).map((_, i) => (
            <i key={i} className={i < meterStrength ? "is-on" : undefined} />
          ))}
        </div>

        <div className="lexicon-area__acts">
          <button
            type="button"
            className="lexicon-area__act"
            onClick={() => {
              const text = [word, definition, example ? `For example: ${example}` : ""]
                .filter(Boolean)
                .join(". ");
              speak(text, { rate: 0.9 });
            }}
            aria-label={`Listen to ${word}`}
          >
            <Volume2 size={14} />
          </button>

          {onAddToMyWords ? (
            <button
              type="button"
              className="lexicon-area__act"
              onClick={isInMyWords ? undefined : onAddToMyWords}
              disabled={isInMyWords}
              aria-label={isInMyWords ? "Already in My Words" : "Add to My Words"}
            >
              {isInMyWords ? <Check size={14} /> : <Plus size={14} />}
            </button>
          ) : null}

          {onToggleFavorite ? (
            <button
              type="button"
              className={cn("lexicon-area__act", isFavorite && "is-fav")}
              onClick={onToggleFavorite}
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              <Heart size={14} fill={isFavorite ? "currentColor" : "none"} />
            </button>
          ) : null}

          <button
            type="button"
            className={cn("lexicon-area__act", isLearned && "is-done")}
            onClick={onMarkLearned}
            disabled={!onMarkLearned || isLearned}
            aria-label={isLearned ? "Marked as learned" : "Mark as learned"}
            title={isLearned ? "Learned" : "Mark learned"}
          >
            <Check size={14} />
          </button>
        </div>
      </div>
    </article>
  );
}

export type { WordCardProps };
