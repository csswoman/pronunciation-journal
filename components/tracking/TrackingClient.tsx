"use client";

// Planned structure:
// <TrackingClient>
//   <TrackingHeader />
//   <TrackingToolbar />
//   <TrackingListView | TrackingGridView | EmptyState />
//   <Modals: QuickAdd + PhraseCapture + EditWord + EditPhrase + DeleteWord + DeleteExplanation />
// </TrackingClient>

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import PageLayout from "@/components/layout/PageLayout";
import { useTracking } from "@/hooks/useTracking";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { normalizeCEFR } from "@/lib/exercises/cefr";
import { TrackingControls } from "./TrackingControls";
import type { FilterCounts, SortMode } from "./TrackingToolbar";
import { TrackingEntries } from "./TrackingEntries";
import { TrackingModalLayer, preloadTrackingWordCapture } from "./TrackingModalLayer";
import { buildTrackingReviewQueue } from "@/lib/tracking/review-queue";
import type { PracticeExercise } from "@/lib/practice/types";
import type { TrackingFilter } from "@/lib/tracking/types";
import { useTrackingModalState } from "./useTrackingModalState";

const PAGE_SIZE = 10;
const loadTrackingReviewRunner = () => import("./TrackingReviewRunner");
const TrackingReviewRunner = dynamic(
  () => loadTrackingReviewRunner().then((module) => module.default),
  { loading: () => <p role="status" className="sr-only">Preparando el repaso…</p> },
);

function preloadTrackingReviewRunner() {
  void loadTrackingReviewRunner();
}

interface TrackingClientProps {
  embed?: boolean;
}

export default function TrackingClient({ embed = false }: TrackingClientProps) {
  const { reviewSources, loading, userId, words, addWord, removeWord, updateWord } = useTracking();
  const { learnerLevel } = useUserPreferences();
  const reviewLevel = learnerLevel ? normalizeCEFR(learnerLevel.level) : undefined;
  const { state: modalState, actions: modalActions } = useTrackingModalState({
    words,
    userId,
    addWord,
    removeWord,
    updateWord,
  });
  const [filter, setFilter] = useState<TrackingFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("due");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeExercises, setActiveExercises] = useState<PracticeExercise[] | null>(null);

  const counts: FilterCounts = useMemo(() => ({
    all: reviewSources.length,
    word: reviewSources.filter((s) => s.item.kind === "word").length,
    phrase: reviewSources.filter((s) => s.item.kind === "phrase").length,
    lesson: reviewSources.filter((s) => s.item.kind === "lesson").length,
    coach: reviewSources.filter((s) => s.item.fromCoach).length,
  }), [reviewSources]);

  const filteredSources = useMemo(() => {
    let list =
      filter === "all"
        ? reviewSources
        : filter === "ai_coach"
          ? reviewSources.filter((s) => s.item.fromCoach)
          : reviewSources.filter((s) => s.item.kind === filter);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((s) => {
        const word = "word" in s ? s.word : null;
        return (
          s.item.title.toLowerCase().includes(q) ||
          Boolean(s.item.description?.toLowerCase().includes(q)) ||
          Boolean(word?.translation?.toLowerCase().includes(q)) ||
          Boolean(word?.meaning?.toLowerCase().includes(q)) ||
          Boolean(word?.ipa?.toLowerCase().includes(q))
        );
      });
    }

    const sorted = [...list];
    if (sortMode === "alpha") {
      sorted.sort((a, b) => a.item.title.localeCompare(b.item.title));
    } else if (sortMode === "recent") {
      sorted.reverse();
    } else if (sortMode === "due") {
      sorted.sort((a, b) => {
        const aDue = a.item.progressLabel === "hoy" ? 1 : 0;
        const bDue = b.item.progressLabel === "hoy" ? 1 : 0;
        return bDue - aDue;
      });
    }
    return sorted;
  }, [filter, reviewSources, searchQuery, sortMode]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchQuery, sortMode]);

  const displayedSources = useMemo(() => {
    return filteredSources.slice(0, currentPage * PAGE_SIZE);
  }, [currentPage, filteredSources]);

  const reviewQueue = useMemo(
    () => buildTrackingReviewQueue(filteredSources, { level: reviewLevel }),
    [filteredSources, reviewLevel],
  );

  const availableReviewCount = reviewQueue.exercises?.length ?? 0;
  const canReview = availableReviewCount > 0;

  function startReview() {
    if (availableReviewCount === 0 || !reviewQueue.exercises) return;
    setActiveExercises(reviewQueue.exercises);
  }

  const hasCategoryItems =
    filter === "all"
      ? reviewSources.length > 0
      : filter === "ai_coach"
        ? reviewSources.some((s) => s.item.fromCoach)
        : reviewSources.some((s) => s.item.kind === filter);

  const entriesData = {
    loading,
    hasCategoryItems,
    filter,
    filteredSources,
    displayedSources,
    searchQuery,
    viewMode,
  };
  const entriesActions = {
    onLoadMore: () => setCurrentPage((page) => page + 1),
    onEditWord: modalActions.onEditWord,
    onDeleteWord: modalActions.onDeleteWord,
    onDeleteExplanation: modalActions.onDeleteExplanationRequest,
    onEditPhrase: modalActions.onEditPhrase,
    onResetSearch: () => setSearchQuery(""),
  };

  const content = (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-8 py-4 sm:py-6">
      <TrackingControls
        counts={counts}
        dueCount={counts.all > 0 ? availableReviewCount : 0}
        canReview={canReview}
        filter={filter}
        searchQuery={searchQuery}
        sortMode={sortMode}
        viewMode={viewMode}
        handlers={{
          onOpenAdd: modalActions.onOpenWordModal,
          onStartReview: startReview,
          onPreloadAdd: preloadTrackingWordCapture,
          onPreloadReview: preloadTrackingReviewRunner,
          onFilterChange: setFilter,
          onSearchChange: setSearchQuery,
          onSortChange: setSortMode,
          onViewModeChange: setViewMode,
        }}
      />
      <TrackingEntries data={entriesData} actions={entriesActions} />
      <TrackingModalLayer state={modalState} actions={modalActions} />
    </div>
  );

  if (activeExercises && activeExercises.length > 0) {
    return (
      <PageLayout archetype="session">
        <TrackingReviewRunner
          exercises={activeExercises}
          onFinish={() => setActiveExercises(null)}
        />
      </PageLayout>
    );
  }

  if (embed) return content;

  return <PageLayout archetype="catalog">{content}</PageLayout>;
}
