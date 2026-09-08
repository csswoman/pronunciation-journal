"use client";

// Planned structure:
// <TrackingCard>
//   <KindIcon />
//   <ContentArea: Title + KindBadge + IPA + (ProgressBadge if not saved) + Details />
//   <ActionArea: MissionLaunch / Edit / Delete />
// </TrackingCard>

import { useState } from "react";
import Link from "next/link";
import { Bookmark, BookOpen, ChevronRight, FileText, Lightbulb, Pencil, Trash2 } from "@/components/icons";
import Badge from "@/components/ui/Badge";
import { PronunciationMissionLaunchButton } from "@/components/pronunciation/PronunciationMissionLaunchButton";
import { getTarget, targetId } from "@/lib/pronunciation/targets/registry";
import { cn } from "@/lib/cn";
import type { TrackingReviewSource } from "@/lib/tracking/review-queue";
import type { TrackedKind } from "@/lib/tracking/types";
import type { WordBankEntry } from "@/lib/word-bank/types";

const registry: Record<TrackedKind, { label: string; icon: typeof Bookmark }> = {
  word: { label: "Palabra", icon: Bookmark },
  phrase: { label: "Frase", icon: FileText },
  lesson: { label: "Lección", icon: BookOpen },
  explanation: { label: "Explicación", icon: Lightbulb },
};

interface TrackingCardProps {
  source: TrackingReviewSource;
  onEditWord: (word: WordBankEntry) => void;
  onDeleteWord: (word: WordBankEntry) => void;
  onDeleteExplanation: (source: TrackingReviewSource) => void;
  onEditPhrase?: (source: TrackingReviewSource) => void;
  onDeletePhrase?: (source: TrackingReviewSource) => void;
}

export function TrackingCard({
  source,
  onEditWord,
  onDeleteWord,
  onDeleteExplanation,
  onEditPhrase,
  onDeletePhrase,
}: TrackingCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { item } = source;

  if (item.kind === "explanation") {
    return (
      <div className="tracking-item">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-surface-sunken text-fg-muted">
          <Lightbulb size={16} aria-hidden />
        </span>
        <span className="min-w-0">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-body-sm font-semibold text-fg">{item.title}</span>
            <Badge label="Explicación" variant="neutral" size="sm" />
            {item.fromCoach && <Badge label="✦ coach" variant="info" size="sm" />}
          </span>
          {item.description ? (
            <>
              <span
                className={cn(
                  "mt-2 block text-body-sm text-fg-muted leading-relaxed whitespace-pre-line",
                  !expanded && "line-clamp-3",
                )}
              >
                {item.description}
              </span>
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="focus-ring mt-1.5 text-caption font-semibold text-primary underline-offset-2 hover:underline"
              >
                {expanded ? "Ver menos" : "Ver más"}
              </button>
            </>
          ) : null}
        </span>
        <span className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => onDeleteExplanation(source)}
            aria-label={`Eliminar ${item.title}`}
            title="Eliminar explicación"
            className="focus-ring flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] text-fg-muted transition-colors hover:bg-error-soft hover:text-error active:scale-95"
          >
            <Trash2 size={16} aria-hidden />
          </button>
        </span>
      </div>
    );
  }

  const entry = registry[item.kind];
  const Icon = entry.icon;
  const word = "word" in source ? source.word : null;
  const trackedPayload = "trackedItem" in source ? source.trackedItem.payload : null;
  const phraseIpa =
    trackedPayload && typeof trackedPayload.ipa === "string" ? trackedPayload.ipa : null;
  const phraseTranslation =
    trackedPayload && typeof trackedPayload.translation === "string" ? trackedPayload.translation : null;
  const phraseMeaning =
    trackedPayload && typeof trackedPayload.meaning === "string" ? trackedPayload.meaning : null;
  const phraseContext =
    trackedPayload && typeof trackedPayload.context === "string" ? trackedPayload.context : null;
  const rawPhraseTarget =
    trackedPayload ? trackedPayload.pronunciationTargetId : undefined;
  const phraseTargetId =
    typeof rawPhraseTarget === "string" && getTarget(rawPhraseTarget).ok
      ? targetId(rawPhraseTarget)
      : null;

  const content = (
    <>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-surface-sunken text-fg-muted">
        <Icon size={16} aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-body-sm font-semibold text-fg">{item.title}</span>
          <Badge label={entry.label} variant="neutral" size="sm" />
          {word?.ipa ? (
            <span className="font-ipa text-caption font-medium text-fg-muted bg-surface-sunken/80 px-1.5 py-0.5 rounded-[var(--radius-xs)] border border-border-subtle">
              /{word.ipa.replace(/^\/+|\/+$/g, "")}/
            </span>
          ) : phraseIpa ? (
            <span className="font-ipa text-caption font-medium text-fg-muted bg-surface-sunken/80 px-1.5 py-0.5 rounded-[var(--radius-xs)] border border-border-subtle">
              /{phraseIpa.replace(/^\/+|\/+$/g, "")}/
            </span>
          ) : null}
          {item.progressState && item.progressState !== "saved" && item.progressLabel ? (
            <Badge label={item.progressLabel} variant="info" size="sm" />
          ) : null}
          {source.item.fromCoach && (
            <Badge label="✦ coach" variant="info" size="sm" />
          )}
        </span>
        {word ? (
          <div className="mt-1 space-y-1">
            {word.translation ? (
              <span className="block text-body-sm font-medium text-fg">
                {word.translation}
              </span>
            ) : null}
            {word.meaning ? (
              <span className="block text-caption text-fg-muted leading-relaxed">
                {word.meaning}
              </span>
            ) : null}
            {word.context ? (
              <p className="mt-1.5 text-caption italic text-fg-muted leading-relaxed">
                “{word.context.replace(/^["“”]+|["“”]+$/g, "")}”
              </p>
            ) : null}
          </div>
        ) : (
          <div className="mt-1 space-y-1">
            {phraseTranslation ? (
              <span className="block text-body-sm font-medium text-fg">
                {phraseTranslation}
              </span>
            ) : null}
            {phraseMeaning ? (
              <span className="block text-caption text-fg-muted leading-relaxed">
                {phraseMeaning}
              </span>
            ) : null}
            {phraseContext ? (
              <p className="mt-1.5 text-caption italic text-fg-muted leading-relaxed">
                “{phraseContext.replace(/^(Example:\s*|Contexto:\s*|["“”])+/gi, "").replace(/["“”]+$/g, "")}”
              </p>
            ) : null}
          </div>
        )}
      </span>
      <span className="flex shrink-0 items-center gap-1.5 text-caption text-fg-subtle">
        {phraseTargetId ? (
          <PronunciationMissionLaunchButton
            targetId={phraseTargetId}
            source="tracking"
            label="Misión"
            className="focus-ring min-h-9 rounded-[var(--radius-sm)] px-3 text-caption font-semibold text-primary hover:bg-primary-soft"
          />
        ) : null}
        {word ? (
          <>
            <button
              type="button"
              onClick={() => onEditWord(word)}
              aria-label={`Editar ${word.text}`}
              title="Editar palabra"
              className="focus-ring flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] text-fg-muted transition-colors hover:bg-surface-sunken hover:text-fg active:scale-95"
            >
              <Pencil size={16} aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => onDeleteWord(word)}
              aria-label={`Eliminar ${word.text}`}
              title="Eliminar palabra"
              className="focus-ring flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] text-fg-muted transition-colors hover:bg-error-soft hover:text-error active:scale-95"
            >
              <Trash2 size={16} aria-hidden />
            </button>
          </>
        ) : item.kind === "phrase" ? (
          <>
            {onEditPhrase ? (
              <button
                type="button"
                onClick={() => onEditPhrase(source)}
                aria-label={`Editar ${item.title}`}
                title="Editar frase"
                className="focus-ring flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] text-fg-muted transition-colors hover:bg-surface-sunken hover:text-fg active:scale-95"
              >
                <Pencil size={16} aria-hidden />
              </button>
            ) : null}
            {onDeletePhrase ? (
              <button
                type="button"
                onClick={() => onDeletePhrase(source)}
                aria-label={`Eliminar ${item.title}`}
                title="Eliminar frase"
                className="focus-ring flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] text-fg-muted transition-colors hover:bg-error-soft hover:text-error active:scale-95"
              >
                <Trash2 size={16} aria-hidden />
              </button>
            ) : null}
          </>
        ) : item.kind === "lesson" ? (
          <span className="flex items-center gap-1 text-caption font-medium text-primary">
            <span>Ir a la lección</span>
            <ChevronRight size={16} className="transition-transform group-hover:translate-x-0.5" aria-hidden />
          </span>
        ) : null}
      </span>
    </>
  );

  const hasDetails = Boolean(
    (word && (word.translation || word.meaning || word.context)) ||
      phraseTranslation ||
      phraseMeaning ||
      phraseContext ||
      item.description,
  );

  const containerClasses = cn(
    "tracking-item",
    hasDetails && "tracking-item--multiline",
    item.href && "group",
  );

  return item.href ? (
    <Link href={item.href} className={containerClasses}>
      {content}
    </Link>
  ) : (
    <div className={containerClasses}>{content}</div>
  );
}
