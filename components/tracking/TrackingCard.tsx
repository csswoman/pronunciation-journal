"use client";

// Planned structure:
// <TrackingCard>
//   <KindIcon />
//   <ContentArea: Title + KindBadge + IPA + (ProgressBadge if not saved) + Details />
//   <ActionArea: MissionLaunch / Edit / Delete />
// </TrackingCard>

import Link from "next/link";
import { Bookmark, BookOpen, FileText, Pencil, Trash2 } from "@/components/icons";
import Badge from "@/components/ui/Badge";
import { PronunciationMissionLaunchButton } from "@/components/pronunciation/PronunciationMissionLaunchButton";
import { getTarget, targetId } from "@/lib/pronunciation/targets/registry";
import type { TrackingReviewSource } from "@/lib/tracking/review-queue";
import type { TrackedKind } from "@/lib/tracking/types";
import type { WordBankEntry } from "@/lib/word-bank/types";

const registry: Record<TrackedKind, { label: string; icon: typeof Bookmark }> = {
  word: { label: "Palabra", icon: Bookmark },
  phrase: { label: "Frase", icon: FileText },
  lesson: { label: "Lección", icon: BookOpen },
};

interface TrackingCardProps {
  source: TrackingReviewSource;
  onEditWord: (word: WordBankEntry) => void;
  onDeleteWord: (word: WordBankEntry) => void;
}

export function TrackingCard({ source, onEditWord, onDeleteWord }: TrackingCardProps) {
  const { item } = source;
  const entry = registry[item.kind];
  const Icon = entry.icon;
  const word = "word" in source ? source.word : null;
  const phraseContext =
    "trackedItem" in source && typeof source.trackedItem.payload.context === "string"
      ? source.trackedItem.payload.context
      : null;
  const rawPhraseTarget =
    "trackedItem" in source ? source.trackedItem.payload.pronunciationTargetId : undefined;
  const phraseTargetId =
    typeof rawPhraseTarget === "string" && getTarget(rawPhraseTarget).ok
      ? targetId(rawPhraseTarget)
      : null;

  const content = (
    <>
      <span className="self-start pt-0.5 text-fg-subtle">
        <Icon size={16} aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-body-sm font-semibold text-fg">{item.title}</span>
          <Badge label={entry.label} variant="neutral" size="sm" />
          {word?.ipa ? (
            <span className="font-ipa text-body-sm text-fg-muted">
              /{word.ipa.replace(/^\/+|\/+$/g, "")}/
            </span>
          ) : null}
          {item.progressState && item.progressState !== "saved" && item.progressLabel ? (
            <Badge label={item.progressLabel} variant="info" size="sm" />
          ) : null}
        </span>
        {word ? (
          <>
            {word.translation ? (
              <span className="mt-0.5 block text-body-sm font-medium text-fg-muted">{word.translation}</span>
            ) : null}
            {word.meaning ? (
              <span className="mt-0.5 block text-caption text-fg-subtle">{word.meaning}</span>
            ) : null}
            {word.context ? (
              <span className="mt-1.5 block text-body-sm italic text-fg-muted">“{word.context}”</span>
            ) : null}
          </>
        ) : phraseContext ? (
          <span className="mt-1 block text-caption text-fg-subtle">Contexto: {phraseContext}</span>
        ) : null}
      </span>
      <span className="flex shrink-0 items-center gap-1 text-caption text-fg-subtle">
        {phraseTargetId ? (
          <PronunciationMissionLaunchButton
            targetId={phraseTargetId}
            source="tracking"
            label="Misión"
            className="min-h-9 rounded-[var(--radius-sm)] px-3 text-caption font-semibold text-primary hover:bg-primary-soft focus-ring"
          />
        ) : null}
        {word ? (
          <>
            <button
              type="button"
              onClick={() => onEditWord(word)}
              aria-label={`Editar ${word.text}`}
              title="Editar palabra"
              className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] text-fg-subtle transition-colors hover:bg-surface-sunken hover:text-fg active:scale-[0.96]"
            >
              <Pencil size={16} aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => onDeleteWord(word)}
              aria-label={`Eliminar ${word.text}`}
              title="Eliminar palabra"
              className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] text-fg-subtle transition-colors hover:bg-error-soft hover:text-error active:scale-[0.96]"
            >
              <Trash2 size={16} aria-hidden />
            </button>
          </>
        ) : null}
      </span>
    </>
  );

  return item.href ? (
    <Link href={item.href} className="tracking-item">
      {content}
    </Link>
  ) : (
    <div className="tracking-item">{content}</div>
  );
}
