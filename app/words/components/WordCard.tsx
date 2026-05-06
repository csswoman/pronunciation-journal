"use client";

import { Flame, Loader2, RefreshCcw, Trash2, Volume2, Snail } from "lucide-react";
import type { WordBankEntry } from "@/lib/types";
import { useAudioPlayback } from "@/hooks/useAudioPlayback";
import Button from "@/components/ui/Button";

interface WordCardProps {
  word: WordBankEntry;
  onMarkDifficult: (id: string) => void;
  onRetry: (id: string) => void;
  onDelete: (id: string) => void;
}

export function WordCard({ word, onMarkDifficult, onRetry, onDelete }: WordCardProps) {
  const { currentSpeed, play } = useAudioPlayback(word.audio_url, word.text);

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
    <article className="group relative rounded-2xl border border-[var(--line-divider)] bg-[var(--card-bg)] p-4 transition-all hover:border-[color-mix(in_oklch,var(--primary)_30%,var(--line-divider))] hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2 flex-wrap">
            <h3 className="font-heading font-semibold text-lg text-[var(--deep-text)] truncate">
              {word.text}
            </h3>
            {word.ipa && (
              <span className="text-xs font-mono text-[var(--text-tertiary)]">
                /{word.ipa.replace(/^\/|\/$/g, "")}/
              </span>
            )}
            <div className="flex gap-1">
              <Button
                variant={currentSpeed === "normal" ? "soft" : "ghost"}
                aria-label={currentSpeed === "normal" ? "Playing..." : "Play pronunciation"}
                title="Play (normal speed)"
                onClick={() => void play("normal")}
                className="!p-1.5 !rounded-lg"
              >
                <Volume2 size={14} />
              </Button>
              <Button
                variant={currentSpeed === "slow" ? "soft" : "ghost"}
                aria-label={currentSpeed === "slow" ? "Playing..." : "Play slow pronunciation"}
                title="Play (slow: 0.75x)"
                onClick={() => void play("slow")}
                className="!p-1.5 !rounded-lg"
              >
                <Snail size={14} />
              </Button>
            </div>
            {word.difficulty > 0 && (
              <span
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-tiny font-semibold"
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
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              {word.translation}
            </p>
          )}

          {word.example && (
            <p className="mt-2 text-sm italic text-[var(--text-tertiary)] line-clamp-1">
              “{word.example}”
            </p>
          )}

          {word.meaning && (
            <p className="mt-2 text-xs text-[var(--text-tertiary)] line-clamp-2">
              {word.meaning}
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant={word.difficulty > 0 ? "soft" : "ghost"}
            size="icon"
            onClick={() => onMarkDifficult(word.id)}
            aria-label={word.difficulty > 0 ? "Remove difficult" : "Mark difficult"}
            title={word.difficulty > 0 ? "Remove difficult" : "Mark as difficult"}
            className="!rounded-lg"
          >
            <Flame size={16} fill={word.difficulty > 0 ? "currentColor" : "none"} />
          </Button>
          <Button
            variant="ghost-danger"
            size="icon"
            onClick={() => onDelete(word.id)}
            aria-label="Delete"
            title="Delete word"
            className="!rounded-lg"
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
            <h3 className="font-heading font-semibold text-lg text-[var(--deep-text)] truncate">
              {text}
            </h3>
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
            <h3 className="font-heading font-semibold text-lg text-[var(--deep-text)] truncate">
              {word.text}
            </h3>
            <span className="text-tiny uppercase tracking-widest text-[var(--error)]">
              Enrichment failed
            </span>
          </div>
          <p className="mt-1 text-xs text-[var(--text-tertiary)]">
            We couldn’t fetch the AI details. Try again.
          </p>
          {word.error_reason && (
            <p className="mt-1 text-tiny uppercase tracking-widest text-[var(--text-tertiary)]">
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
