"use client";

import { Flame, Loader2, RefreshCcw, Trash2 } from "lucide-react";
import type { WordBankEntry } from "@/lib/types";
import { useAudioPlayback } from "@/hooks/useAudioPlayback";
import Button from "@/components/ui/Button";
import { H4 } from "@/components/ui/Typography";
import PronunciationBadge from "@/components/vocabulary/PronunciationBadge";

interface WordCardProps {
  word: WordBankEntry;
  onMarkDifficult: (id: string) => void;
  onRetry: (id: string) => void;
  onDelete: (id: string) => void;
  selected?: boolean;
  onSelect?: (id: string) => void;
}

export function WordCard({ word, onMarkDifficult, onRetry, onDelete, selected, onSelect }: WordCardProps) {
  const { play } = useAudioPlayback(word.audio_url, word.text);

  if (word.status === "processing") {
    return (
      <WordCardProcessing
        text={word.text}
        wordId={word.id}
        onRetry={onRetry}
        onDelete={onDelete}
      />
    );
  }
  if (word.status === "failed") {
    return <WordCardFailed word={word} onRetry={onRetry} onDelete={onDelete} />;
  }

  return (
    <article
      className="group relative rounded-2xl border bg-[var(--card-bg)] px-4 py-3 transition-all duration-150 hover:shadow-md cursor-pointer hover:-translate-y-px hover:border-[var(--primary)] focus-within:border-[var(--primary)]"
      style={{
        borderColor: selected
          ? "var(--primary)"
          : "var(--line-divider)",
        background: selected
          ? "color-mix(in oklch, var(--primary) 5%, var(--card-bg))"
          : "var(--card-bg)",
      }}
    >
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
            <H4 as="h3" className="truncate text-fg font-bold text-[20px] leading-[1.2]">
              {word.text}
            </H4>
            {word.ipa && (
              <PronunciationBadge
                ipa={`/${word.ipa.replace(/^\/|\/$/g, "")}/`}
                audioUrl={word.audio_url ?? undefined}
                onClick={() => void play("normal")}
              />
            )}
            {word.difficulty > 0 && (
              <span
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-tiny font-semibold ml-auto"
                style={{
                  background: "color-mix(in oklch, var(--primary) 14%, transparent)",
                  color: "var(--primary)",
                }}
                title={`Marked difficult ${word.difficulty}×`}
              >
                <Flame size={10} />
                {word.difficulty}
              </span>
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
          <Button
            variant={word.difficulty > 0 ? "soft" : "ghost"}
            size="icon"
            onClick={() => onMarkDifficult(word.id)}
            aria-label={word.difficulty > 0 ? "Remove difficult" : "Mark difficult"}
            title={word.difficulty > 0 ? "Remove difficult" : "Mark as difficult"}
            className="!rounded-lg min-w-8 min-h-8"
          >
            <Flame size={16} fill={word.difficulty > 0 ? "currentColor" : "none"} />
          </Button>
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

// ── Processing skeleton ─────────────────────────────────────────────────────

function WordCardProcessing({
  text,
  wordId,
  onRetry,
  onDelete,
}: {
  text: string;
  wordId: string;
  onRetry: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <article className="relative rounded-2xl border border-[color-mix(in_oklch,var(--primary)_25%,var(--line-divider))] bg-[var(--card-bg)] p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Loader2
              size={14}
              className="animate-spin shrink-0"
              style={{ color: "var(--primary)" }}
            />
            <H4 as="h3" className="truncate">
              {text}
            </H4>
            <span
              className="text-tiny uppercase tracking-widest"
              style={{ color: "var(--primary)" }}
            >
              Enriching…
            </span>
          </div>

          <div className="space-y-1.5 pl-5">
            <div className="h-2.5 w-1/3 rounded bg-[var(--btn-regular-bg)] shimmer" />
            <div className="h-2.5 w-2/3 rounded bg-[var(--btn-regular-bg)] shimmer" />
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button variant="soft" size="icon" onClick={() => onRetry(wordId)} aria-label="Retry enrichment" title="Retry enrichment" className="!rounded-lg">
            <RefreshCcw size={16} />
          </Button>
          <Button variant="ghost-danger" size="icon" onClick={() => onDelete(wordId)} aria-label="Delete word" title="Delete word" className="!rounded-lg">
            <Trash2 size={16} />
          </Button>
        </div>
      </div>

      <style>{`
        .shimmer {
          position: relative;
          overflow: hidden;
        }
        .shimmer::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            transparent,
            color-mix(in oklch, var(--primary) 18%, transparent),
            transparent
          );
          animation: shimmer 1.4s infinite;
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </article>
  );
}

// ── Failed state ────────────────────────────────────────────────────────────

function WordCardFailed({
  word,
  onRetry,
  onDelete,
}: {
  word: WordBankEntry;
  onRetry: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <article className="group relative rounded-2xl border border-[var(--line-divider)] bg-[var(--card-bg)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <H4 as="h3" className="truncate">
              {word.text}
            </H4>
            <span className="text-tiny uppercase tracking-widest text-[var(--error)]">
              Enrichment failed
            </span>
          </div>
          <p className="mt-1 text-xs text-fg-subtle">
            We couldn’t fetch the AI details. Try again.
          </p>
          {word.error_reason && (
            <p className="mt-1 text-tiny uppercase tracking-widest text-fg-subtle">
              {word.error_reason.replace("_", " ")}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Button variant="soft" size="icon" onClick={() => onRetry(word.id)} aria-label="Retry enrichment" title="Retry" className="!rounded-lg">
            <RefreshCcw size={16} />
          </Button>
          <Button variant="ghost-danger" size="icon" onClick={() => onDelete(word.id)} aria-label="Delete" title="Delete" className="!rounded-lg">
            <Trash2 size={16} />
          </Button>
        </div>
      </div>
    </article>
  );
}
