"use client";

// Planned structure:
// <TrackingEntries>
//   <WordCarousel | TrackingEmptyState | NoResults | TrackingListView | TrackingGridView />
// </TrackingEntries>

import dynamic from "next/dynamic";
import { FALLBACK_WORDS } from "@/hooks/loading-words-data";
import type { WordBankEntry } from "@/lib/word-bank/types";
import type { TrackingReviewSource } from "@/lib/tracking/review-queue";
import type { TrackingFilter } from "@/lib/tracking/types";
import { TrackingEmptyState } from "./TrackingEmptyState";
import { TrackingListView } from "./TrackingListView";
import { TrackingGridView } from "./TrackingGridView";

const LoadingWordCarousel = dynamic(
  () => import("@/components/practice/session/WordCarousel").then((module) => module.WordCarousel),
  { loading: () => <p role="status" className="sr-only">Preparando tus guardados…</p> },
);

interface TrackingEntriesData {
  loading: boolean;
  hasCategoryItems: boolean;
  filter: TrackingFilter;
  filteredSources: TrackingReviewSource[];
  displayedSources: TrackingReviewSource[];
  searchQuery: string;
  viewMode: "list" | "grid";
}

interface TrackingEntriesActions {
  onLoadMore: () => void;
  onEditWord: (word: WordBankEntry) => void;
  onDeleteWord: (word: WordBankEntry) => void;
  onDeleteExplanation: (source: TrackingReviewSource) => void;
  onEditPhrase: (source: TrackingReviewSource) => void;
  onResetSearch: () => void;
}

interface TrackingEntriesProps {
  data: TrackingEntriesData;
  actions: TrackingEntriesActions;
}

export function TrackingEntries({ data, actions }: TrackingEntriesProps) {
  if (data.loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingWordCarousel words={FALLBACK_WORDS} />
      </div>
    );
  }

  if (!data.hasCategoryItems) return <TrackingEmptyState filter={data.filter} />;

  if (data.filteredSources.length === 0) {
    return (
      <div className="rounded-3xl border border-border-subtle bg-surface-raised p-8 text-center">
        <p className="text-body-sm text-fg-muted">
          No se encontraron resultados para “{data.searchQuery}”.
        </p>
        <button
          type="button"
          onClick={actions.onResetSearch}
          className="focus-ring mt-3 inline-flex items-center text-caption font-semibold text-primary hover:underline"
        >
          Restablecer búsqueda
        </button>
      </div>
    );
  }

  const viewProps = {
    sources: data.displayedSources,
    totalCount: data.filteredSources.length,
    showingCount: data.displayedSources.length,
    hasMore: data.displayedSources.length < data.filteredSources.length,
    onLoadMore: actions.onLoadMore,
    onEditWord: actions.onEditWord,
    onDeleteWord: actions.onDeleteWord,
    onDeleteExplanation: actions.onDeleteExplanation,
    onEditPhrase: actions.onEditPhrase,
    onDeletePhrase: actions.onDeleteExplanation,
  };

  return data.viewMode === "list"
    ? <TrackingListView {...viewProps} />
    : <TrackingGridView {...viewProps} />;
}
