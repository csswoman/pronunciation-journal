"use client";

import { Loader2, RefreshCcw, Trash2 } from "lucide-react";
import type { WordBankEntry } from "@/lib/word-bank/types";
import Button from "@/components/ui/Button";
import { H4 } from "@/components/ui/Typography";

export interface WordCardVariantProps {
  text: string;
  wordId: string;
  onRetry: (id: string) => void;
  onDelete: (id: string) => void;
}

export function WordCardProcessing({ text, wordId, onRetry, onDelete }: WordCardVariantProps) {
  return (
    <article className="relative rounded-2xl border border-[color-mix(in_oklch,var(--primary)_25%,var(--line-divider))] bg-surface-raised p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Loader2 size={14} className="animate-spin shrink-0 text-primary" />
            <H4 as="h3" className="truncate">
              {text}
            </H4>
            <span className="text-tiny uppercase tracking-widest text-primary">
              Enriching…
            </span>
          </div>

          <div className="space-y-1.5 pl-5">
            <div className="h-2.5 w-1/3 rounded bg-surface-sunken shimmer" />
            <div className="h-2.5 w-2/3 rounded bg-surface-sunken shimmer" />
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="soft"
            size="icon"
            onClick={() => onRetry(wordId)}
            aria-label="Retry enrichment"
            title="Retry enrichment"
            className="!rounded-lg"
          >
            <RefreshCcw size={16} />
          </Button>
          <Button
            variant="ghost-danger"
            size="icon"
            onClick={() => onDelete(wordId)}
            aria-label="Delete word"
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

export function WordCardFailed({
  word,
  onRetry,
  onDelete,
}: {
  word: WordBankEntry;
  onRetry: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <article className="group relative rounded-2xl border border-[var(--line-divider)] bg-surface-raised p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <H4 as="h3" className="truncate">
              {word.text}
            </H4>
            <span className="text-tiny uppercase tracking-widest text-error">Enrichment failed</span>
          </div>
          <p className="mt-1 text-xs text-fg-subtle">We couldn't fetch the AI details. Try again.</p>
          {word.error_reason && (
            <p className="mt-1 text-tiny uppercase tracking-widest text-fg-subtle">
              {word.error_reason.replace("_", " ")}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="soft"
            size="icon"
            onClick={() => onRetry(word.id)}
            aria-label="Retry enrichment"
            title="Retry"
            className="!rounded-lg"
          >
            <RefreshCcw size={16} />
          </Button>
          <Button
            variant="ghost-danger"
            size="icon"
            onClick={() => onDelete(word.id)}
            aria-label="Delete"
            title="Delete"
            className="!rounded-lg"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      </div>
    </article>
  );
}
