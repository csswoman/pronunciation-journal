"use client";

// Planned structure:
// <TrackingClient>
//   <TrackingHeader />
//   <TrackingToolbar />
//   <TrackingListView | TrackingGridView | EmptyState />
//   <Modals: QuickAdd + PhraseCapture + EditWord + EditPhrase + DeleteWord + DeleteExplanation />
// </TrackingClient>

import { useCallback, useEffect, useMemo, useState } from "react";
import PageLayout from "@/components/layout/PageLayout";
import { useTracking } from "@/hooks/useTracking";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { normalizeCEFR } from "@/lib/exercises/cefr";
import { QuickAddModal } from "@/components/vocabulary/words/QuickAddModal";
import { TrackingEmptyState } from "./TrackingEmptyState";
import { TrackingHeader } from "./TrackingHeader";
import { TrackingToolbar, type FilterCounts, type SortMode } from "./TrackingToolbar";
import { TrackingListView } from "./TrackingListView";
import { TrackingGridView } from "./TrackingGridView";
import { PhraseCaptureModal } from "./PhraseCaptureModal";
import { EditWordModal } from "./EditWordModal";
import { EditPhraseModal } from "./EditPhraseModal";
import { DeleteWordDialog } from "./DeleteWordDialog";
import { DeleteExplanationDialog } from "./DeleteExplanationDialog";
import { saveTrackedItem, removeTrackedItem, updateTrackedItem } from "@/lib/tracking/queries";
import { buildTrackingReviewQueue, type TrackingReviewSource } from "@/lib/tracking/review-queue";
import PracticeSession from "@/components/practice/PracticeSession";
import { WordCarousel } from "@/components/practice/session/WordCarousel";
import { FALLBACK_WORDS } from "@/hooks/loading-words-data";
import type { PracticeExercise } from "@/lib/practice/types";
import type { TrackedItem, TrackingFilter } from "@/lib/tracking/types";
import type { WordBankEntry } from "@/lib/word-bank/types";

const PAGE_SIZE = 10;

interface TrackingClientProps {
  embed?: boolean;
}

export default function TrackingClient({ embed = false }: TrackingClientProps) {
  const { reviewSources, loading, userId, words, addWord, removeWord, updateWord } = useTracking();
  const { learnerLevel } = useUserPreferences();
  const reviewLevel = learnerLevel ? normalizeCEFR(learnerLevel.level) : undefined;
  const [filter, setFilter] = useState<TrackingFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("due");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [currentPage, setCurrentPage] = useState(1);
  const [phrase, setPhrase] = useState("");
  const [phraseContext, setPhraseContext] = useState("");
  const [showWordModal, setShowWordModal] = useState(false);
  const [showPhraseModal, setShowPhraseModal] = useState(false);
  const [editingWord, setEditingWord] = useState<WordBankEntry | null>(null);
  const [editingTrackedItem, setEditingTrackedItem] = useState<TrackedItem | null>(null);
  const [deletingWord, setDeletingWord] = useState<WordBankEntry | null>(null);
  const [deletingExplanation, setDeletingExplanation] = useState<TrackingReviewSource | null>(null);
  const [activeExercises, setActiveExercises] = useState<PracticeExercise[] | null>(null);

  const editExistingWord = useCallback((wordId: string) => {
    const existing = words.find((w) => w.id === wordId);
    if (!existing) return;
    setShowWordModal(false);
    setEditingWord(existing);
  }, [words]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (showWordModal || showPhraseModal || e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable) return;
      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        setShowWordModal(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showPhraseModal, showWordModal]);

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

  async function addPhrase() {
    const text = phrase.trim();
    if (!userId || !text) return;
    const context = phraseContext.trim();
    await saveTrackedItem({ userId, kind: "phrase", ref: text.toLowerCase(), title: text, payload: { text, ...(context ? { context } : {}) } });
    setPhrase("");
    setPhraseContext("");
    setShowPhraseModal(false);
  }

  async function deleteExplanation(source: TrackingReviewSource) {
    if (!userId || !("trackedItem" in source)) return;
    await removeTrackedItem(userId, source.trackedItem.kind, source.trackedItem.ref);
    setDeletingExplanation(null);
  }

  async function handleUpdateTrackedItem(id: string, updates: { title?: string | null; payload?: Record<string, unknown> }) {
    if (!userId) return;
    await updateTrackedItem({ id, userId, title: updates.title, payload: updates.payload });
  }

  const hasCategoryItems =
    filter === "all"
      ? reviewSources.length > 0
      : filter === "ai_coach"
        ? reviewSources.some((s) => s.item.fromCoach)
        : reviewSources.some((s) => s.item.kind === filter);

  const content = (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-8 py-4 sm:py-6">
      <TrackingHeader
        totalCount={counts.all}
        dueCount={counts.all > 0 ? availableReviewCount : 0}
        onOpenAdd={() => setShowWordModal(true)}
        onStartReview={startReview}
        canReview={canReview}
      />

      <TrackingToolbar
        filter={filter}
        onFilterChange={setFilter}
        counts={counts}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortMode={sortMode}
        onSortChange={setSortMode}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <WordCarousel words={FALLBACK_WORDS} />
        </div>
      ) : !hasCategoryItems ? (
        <TrackingEmptyState filter={filter} />
      ) : filteredSources.length === 0 ? (
        <div className="rounded-3xl border border-border-subtle bg-surface-raised p-8 text-center">
          <p className="text-body-sm text-fg-muted">No se encontraron resultados para “{searchQuery}”.</p>
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="focus-ring mt-3 inline-flex items-center text-caption font-semibold text-primary hover:underline"
          >
            Restablecer búsqueda
          </button>
        </div>
      ) : viewMode === "list" ? (
        <TrackingListView
          sources={displayedSources}
          totalCount={filteredSources.length}
          showingCount={displayedSources.length}
          hasMore={displayedSources.length < filteredSources.length}
          onLoadMore={() => setCurrentPage((p) => p + 1)}
          onEditWord={setEditingWord}
          onDeleteWord={setDeletingWord}
          onDeleteExplanation={setDeletingExplanation}
          onEditPhrase={(s) => "trackedItem" in s && setEditingTrackedItem(s.trackedItem)}
          onDeletePhrase={setDeletingExplanation}
        />
      ) : (
        <TrackingGridView
          sources={displayedSources}
          totalCount={filteredSources.length}
          showingCount={displayedSources.length}
          hasMore={displayedSources.length < filteredSources.length}
          onLoadMore={() => setCurrentPage((p) => p + 1)}
          onEditWord={setEditingWord}
          onDeleteWord={setDeletingWord}
          onDeleteExplanation={setDeletingExplanation}
          onEditPhrase={(s) => "trackedItem" in s && setEditingTrackedItem(s.trackedItem)}
          onDeletePhrase={setDeletingExplanation}
        />
      )}

      <QuickAddModal open={showWordModal} onClose={() => setShowWordModal(false)} onSubmit={addWord} onEditExisting={editExistingWord} contextLabel="TRACKING" />
      <PhraseCaptureModal open={showPhraseModal} value={phrase} onChange={setPhrase} context={phraseContext} onContextChange={setPhraseContext} onClose={() => setShowPhraseModal(false)} onSubmit={() => void addPhrase()} />
      <EditWordModal word={editingWord} onClose={() => setEditingWord(null)} onSubmit={updateWord} />
      <EditPhraseModal trackedItem={editingTrackedItem} onClose={() => setEditingTrackedItem(null)} onSubmit={handleUpdateTrackedItem} />
      <DeleteWordDialog word={deletingWord} onClose={() => setDeletingWord(null)} onConfirm={removeWord} />
      <DeleteExplanationDialog source={deletingExplanation} onClose={() => setDeletingExplanation(null)} onConfirm={deleteExplanation} />
    </div>
  );

  if (activeExercises && activeExercises.length > 0) {
    return (
      <PageLayout archetype="session">
        <PracticeSession
          context="review"
          exercises={activeExercises}
          sessionLength={activeExercises.length}
          sessionLabel="Contenido guardado"
          onSessionComplete={() => setActiveExercises(null)}
          onExit={() => setActiveExercises(null)}
        />
      </PageLayout>
    );
  }

  if (embed) return content;

  return <PageLayout archetype="catalog">{content}</PageLayout>;
}
