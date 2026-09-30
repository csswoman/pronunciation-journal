"use client";

// Planned structure:
// <TrackingGridView>
//   <CardsGridContainer: TrackingGridCardItem* />
//   <TableFooter: CountSummary + LoadMoreButton />
// </TrackingGridView>

import Link from "next/link";
import { Bookmark, BookOpen, FileText, Lightbulb } from "@/components/icons";
import { cn } from "@/lib/cn";
import type { TrackingReviewSource } from "@/lib/tracking/review-queue";
import type { WordBankEntry } from "@/lib/word-bank/types";
import { TrackingMasteryBar } from "./TrackingMasteryBar";
import { getSourceDetails } from "./tracking-helpers";

interface TrackingGridViewProps {
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

export function TrackingGridView({
  sources,
  totalCount,
  showingCount,
  hasMore,
  onLoadMore,
}: TrackingGridViewProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {sources.map((source) => {
          const details = getSourceDetails(source);
          const itemId = source.item.id;

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

          const cardContent = (
            <div className="rounded-2xl border border-border-subtle bg-surface-raised p-4 flex flex-col justify-between gap-3 min-h-[148px] hover:border-border-strong hover:shadow-xs transition-all">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-caption", pastelClasses)}>
                      <Icon size={13} aria-hidden />
                    </span>
                    <span className="font-mono text-overline font-semibold uppercase tracking-wider text-fg-muted">
                      {details.kicker}
                    </span>
                  </div>

                  {details.statusBadge ? (
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-caption font-semibold",
                        details.statusBadge.variant === "coral" || details.statusBadge.label === "hoy"
                          ? "bg-coral-soft text-coral-deep dark:bg-coral-soft/30 dark:text-coral"
                          : "bg-mint-soft text-mint-deep dark:bg-mint-soft/30 dark:text-mint",
                      )}
                    >
                      {details.statusBadge.label}
                    </span>
                  ) : null}
                </div>

                <h3 className="font-display font-bold text-body-md text-fg leading-snug line-clamp-2">
                  {details.title}
                </h3>

                {details.ipa ? (
                  <p className="mt-0.5 font-ipa text-caption text-fg-muted font-medium">
                    {details.ipa}
                  </p>
                ) : details.kind === "lesson" && details.progressPercent !== null ? (
                  <p className="mt-0.5 text-caption text-fg-muted font-medium">
                    {details.progressPercent} % · 4 min
                  </p>
                ) : null}

                {details.meaning ? (
                  <p className="mt-1.5 text-body-sm text-fg-muted leading-relaxed line-clamp-2">
                    {details.meaning}
                  </p>
                ) : null}
              </div>

              {!details.statusBadge && (details.masteryLevel || details.progressPercent !== null) ? (
                <div className="pt-1">
                  <TrackingMasteryBar
                    masteryLevel={details.masteryLevel}
                    statusBadge={null}
                    progressPercent={details.progressPercent}
                  />
                </div>
              ) : null}
            </div>
          );

          return source.item.href ? (
            <Link key={itemId} href={source.item.href} className="block">
              {cardContent}
            </Link>
          ) : (
            <div key={itemId}>{cardContent}</div>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-caption text-fg-muted font-medium px-2">
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
