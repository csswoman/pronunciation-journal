"use client";

// Planned structure:
// <TrackingListView>
//   <TableHeaderRow: Palabra/Frase + Significado + Origen + Repaso />
//   <TableRowsList: TrackingRowItem* />
//   <TableFooter: CountSummary + LoadMoreButton />
// </TrackingListView>

import Link from "next/link";
import { Bookmark, BookOpen, FileText, Lightbulb, Pencil, Trash2 } from "@/components/icons";
import { cn } from "@/lib/cn";
import type { TrackingReviewSource } from "@/lib/tracking/review-queue";
import type { WordBankEntry } from "@/lib/word-bank/types";
import { TrackingMasteryBar } from "./TrackingMasteryBar";
import { getSourceDetails } from "./tracking-helpers";

interface TrackingListViewProps {
  sources: TrackingReviewSource[];
  totalCount: number;
  showingCount: number;
  hasMore: boolean;
  onLoadMore?: () => void;
  onEditWord: (word: WordBankEntry) => void;
  onDeleteWord: (word: WordBankEntry) => void;
  onDeleteExplanation: (source: TrackingReviewSource) => void;
  onEditPhrase?: (source: TrackingReviewSource) => void;
  onDeletePhrase?: (source: TrackingReviewSource) => void;
}

export function TrackingListView({
  sources,
  totalCount,
  showingCount,
  hasMore,
  onLoadMore,
  onEditWord,
  onDeleteWord,
  onDeleteExplanation,
  onEditPhrase,
  onDeletePhrase,
}: TrackingListViewProps) {
  return (
    <div className="rounded-3xl border border-border-subtle bg-surface-raised p-4 sm:p-6 shadow-xs">
      <div className="hidden md:grid md:grid-cols-12 gap-4 pb-3 border-b border-border-subtle text-overline font-semibold uppercase tracking-wider text-fg-subtle px-2">
        <div className="col-span-4">PALABRA O FRASE</div>
        <div className="col-span-4">SIGNIFICADO</div>
        <div className="col-span-2">ORIGEN</div>
        <div className="col-span-2 text-right">REPASO</div>
      </div>

      <div className="divide-y divide-border-subtle/60">
        {sources.map((source) => {
          const details = getSourceDetails(source);
          const itemId = source.item.id;
          const word = "word" in source ? source.word : null;

          const Icon =
            details.kind === "word"
              ? Bookmark
              : details.kind === "phrase"
                ? FileText
                : details.kind === "lesson"
                  ? BookOpen
                  : Lightbulb;

          const pastelClasses =
            details.pastelTheme === "coral"
              ? "bg-coral-soft text-coral-deep dark:bg-coral-soft/25 dark:text-coral-deep"
              : details.pastelTheme === "butter"
                ? "bg-butter-soft text-butter-deep dark:bg-butter-soft/25 dark:text-butter-deep"
                : details.pastelTheme === "sky"
                  ? "bg-sky-soft text-sky-deep dark:bg-sky-soft/25 dark:text-sky-deep"
                  : "bg-mint-soft text-mint-deep dark:bg-mint-soft/25 dark:text-mint-deep";

          const rowContent = (
            <div className="py-3 px-2 flex flex-col md:grid md:grid-cols-12 gap-2 md:gap-4 items-start md:items-center hover:bg-surface-sunken/50 rounded-xl transition-colors">
              <div className="col-span-4 flex items-center gap-3 min-w-0">
                <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-medium", pastelClasses)}>
                  <Icon size={16} aria-hidden />
                </span>
                <div className="min-w-0 truncate">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-tiny font-semibold uppercase tracking-wider text-fg-subtle">
                      {details.kicker}
                    </span>
                  </div>
                  <span className="font-display font-bold text-body-sm text-fg truncate">
                    {details.title}
                  </span>
                  {details.ipa ? (
                    <span className="ml-2 font-ipa text-caption text-fg-muted font-medium">
                      {details.ipa}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="col-span-4 text-body-sm text-fg-muted truncate w-full">
                <span>{details.meaning || "—"}</span>
                {details.context ? (
                  <p className="text-caption text-fg-subtle italic truncate">
                    “{details.context}”
                  </p>
                ) : null}
              </div>

              <div className="col-span-2 text-body-sm text-fg-subtle truncate">
                {details.origin}
              </div>

              <div className="col-span-2 flex items-center justify-end gap-2 ml-auto md:ml-0">
                <TrackingMasteryBar
                  masteryLevel={details.masteryLevel}
                  statusBadge={details.statusBadge}
                  progressPercent={details.progressPercent}
                />

                <div className="flex items-center gap-1">
                  {word ? (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onEditWord(word);
                        }}
                        aria-label={`Editar ${details.title}`}
                        className="focus-ring flex h-8 w-8 items-center justify-center rounded-lg text-fg-subtle hover:bg-surface-sunken hover:text-fg transition-colors"
                      >
                        <Pencil size={15} aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onDeleteWord(word);
                        }}
                        aria-label={`Eliminar ${details.title}`}
                        className="focus-ring flex h-8 w-8 items-center justify-center rounded-lg text-fg-subtle hover:bg-surface-sunken hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={15} aria-hidden />
                      </button>
                    </>
                  ) : details.kind === "phrase" ? (
                    <>
                      {onEditPhrase && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onEditPhrase(source);
                          }}
                          aria-label={`Editar ${details.title}`}
                          className="focus-ring flex h-8 w-8 items-center justify-center rounded-lg text-fg-subtle hover:bg-surface-sunken hover:text-fg transition-colors"
                        >
                          <Pencil size={15} aria-hidden />
                        </button>
                      )}
                      {onDeletePhrase && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onDeletePhrase(source);
                          }}
                          aria-label={`Eliminar ${details.title}`}
                          className="focus-ring flex h-8 w-8 items-center justify-center rounded-lg text-fg-subtle hover:bg-surface-sunken hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={15} aria-hidden />
                        </button>
                      )}
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onDeleteExplanation(source);
                      }}
                      aria-label={`Eliminar ${details.title}`}
                      className="focus-ring flex h-8 w-8 items-center justify-center rounded-lg text-fg-subtle hover:bg-surface-sunken hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={15} aria-hidden />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );

          return source.item.href ? (
            <Link key={itemId} href={source.item.href} className="block">
              {rowContent}
            </Link>
          ) : (
            <div key={itemId}>{rowContent}</div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-border-subtle flex items-center justify-between text-caption text-fg-muted font-medium">
        <span>{showingCount} de {totalCount}</span>
        {hasMore && onLoadMore ? (
          <button
            type="button"
            onClick={onLoadMore}
            className="focus-ring rounded-full border border-border-subtle bg-surface-raised px-4 py-1.5 text-body-sm font-semibold text-fg hover:bg-surface-sunken"
          >
            Cargar más
          </button>
        ) : null}
      </div>
    </div>
  );
}
