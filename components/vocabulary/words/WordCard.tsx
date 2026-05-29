"use client";

import { Heart, Trash2 } from "lucide-react";
import type { WordBankEntry } from "@/lib/word-bank/types";
import { useAudioPlayback } from "@/hooks/useAudioPlayback";
import Button from "@/components/ui/Button";
import { H4 } from "@/components/ui/Typography";
import PronunciationBadge from "@/components/vocabulary/PronunciationBadge";
import { WordStrengthBars } from "@/components/vocabulary/words/WordStrengthBars";
import { WordCardProcessing, WordCardFailed } from "@/components/vocabulary/words/WordCardVariants";
import { getWordStrength } from "@/lib/word-bank/strength";

interface WordCardProps {
  word: WordBankEntry;
  onRetry: (id: string) => void;
  onDelete: (id: string) => void;
  selected?: boolean;
  onSelect?: (id: string) => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export function WordCard({ word, onRetry, onDelete, selected, onSelect, isFavorite, onToggleFavorite }: WordCardProps) {
  const { play } = useAudioPlayback(word.audio_url, word.text);

  if (word.status === "processing") {
    return <WordCardProcessing text={word.text} wordId={word.id} onRetry={onRetry} onDelete={onDelete} />;
  }
  if (word.status === "failed") {
    return <WordCardFailed word={word} onRetry={onRetry} onDelete={onDelete} />;
  }

  const strength = getWordStrength(word);
  const strengthColor = strength === "strong" ? "var(--success)" : strength === "medium" ? "var(--warning)" : "var(--error)";

  return (
    <article
      className="group relative rounded-2xl border bg-[var(--card-bg)] pl-4 pr-5 py-4 shadow-sm transition-all duration-150 hover:shadow-md cursor-pointer hover:-translate-y-px hover:border-[var(--primary)] focus-within:border-[var(--primary)] overflow-hidden"
      style={{
        borderColor: selected ? "var(--primary)" : "var(--line-divider)",
        background: selected ? "color-mix(in oklch, var(--primary) 5%, var(--card-bg))" : "var(--card-bg)",
      }}
    >
      {/* Strength accent border */}
      <div
        aria-hidden
        className="absolute left-0 top-0 bottom-0 w-[4px] rounded-l-2xl"
        style={{ background: strengthColor, opacity: 0.7 }}
      />
      <div className="flex items-start justify-between gap-3">
        {onSelect && (
          <button
            type="button"
            onClick={() => onSelect(word.id)}
            aria-label={selected ? "Deselect word" : "Select word"}
            style={{
              flexShrink: 0,
              marginTop: 2,
              width: 18,
              height: 18,
              borderRadius: 5,
              border: `2px solid ${selected ? "var(--primary)" : "var(--line-divider)"}`,
              background: selected ? "var(--primary)" : "transparent",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 120ms",
            }}
          >
            {selected && (
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <H4 as="h3" className="truncate text-fg font-bold text-h4 leading-[1.2]">
              {word.text}
            </H4>
            <WordStrengthBars strength={strength} size={13} />
            {word.ipa && (
              <PronunciationBadge
                ipa={`/${word.ipa.replace(/^\/|\/$/g, "")}/`}
                audioUrl={word.audio_url ?? undefined}
                onClick={() => void play("normal")}
              />
            )}
          </div>

          {word.translation && (
            <p className="mt-0.5 text-[15px] leading-[1.3] font-medium text-[var(--primary)]">
              {word.translation}
            </p>
          )}

          {word.example && (
            <p className="mt-2 text-[14px] leading-[1.4] italic text-fg-muted line-clamp-1">
              “{word.example}”
            </p>
          )}

          {word.meaning && (
            <p className="mt-1 text-[13px] leading-[1.4] text-fg-subtle line-clamp-2">
              {word.meaning}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
          {onToggleFavorite && (
            <button
              onClick={e => { e.stopPropagation(); onToggleFavorite(); }}
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
              className={`p-1.5 rounded-full transition-colors ${
                isFavorite
                  ? "text-error hover:text-error/70"
                  : "text-fg-muted hover:text-fg"
              }`}
            >
              <Heart size={14} fill={isFavorite ? "currentColor" : "none"} />
            </button>
          )}
          <Button
            variant="ghost-danger"
            size="icon"
            onClick={() => onDelete(word.id)}
            aria-label="Delete"
            title="Delete word"
            className="!rounded-lg min-w-8 min-h-8"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      </div>
    </article>
  );
}
