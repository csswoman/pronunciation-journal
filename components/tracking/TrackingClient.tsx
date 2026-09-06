"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BookmarkPlus, FileText, Plus } from "@/components/icons";
import PageHeader from "@/components/layout/PageHeader";
import PageLayout from "@/components/layout/PageLayout";
import { useTracking } from "@/hooks/useTracking";
import { QuickAddModal } from "@/components/vocabulary/words/QuickAddModal";
import { TrackingEmptyState } from "./TrackingEmptyState";
import { TrackingCard } from "./TrackingCard";
import { TrackingToolbar } from "./TrackingToolbar";
import { PhraseCaptureModal } from "./PhraseCaptureModal";
import { EditWordModal } from "./EditWordModal";
import { DeleteWordDialog } from "./DeleteWordDialog";
import { saveTrackedItem } from "@/lib/tracking/queries";
import { buildTrackingReviewQueue } from "@/lib/tracking/review-queue";
import Button from "@/components/ui/Button";
import PracticeSession from "@/components/practice/PracticeSession";
import { ListPagination } from "@/components/ui/ListPagination";
import type { PracticeExercise } from "@/lib/practice/types";
import type { TrackingFilter } from "@/lib/tracking/types";
import type { WordBankEntry } from "@/lib/word-bank/types";

const PAGE_SIZE = 15;

interface TrackingClientProps {
  embed?: boolean;
}

// Planned structure:
// <TrackingClient>
//   <TrackingWorkspace>
//     <TrackingCaptureAside: QuickAddWord + QuickAddPhrase + ShortcutBadge />
//     <TrackingContent: TrackingToolbar + TrackingList + ListPagination />
//   </TrackingWorkspace>
//   <Modals: QuickAddModal + PhraseCaptureModal + EditWordModal + DeleteWordDialog />
// </TrackingClient>
export default function TrackingClient({ embed = false }: TrackingClientProps) {
  const { reviewSources, loading, userId, words, addWord, removeWord, updateWord } = useTracking();
  const [filter, setFilter] = useState<TrackingFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [phrase, setPhrase] = useState("");
  const [phraseContext, setPhraseContext] = useState("");
  const [showWordModal, setShowWordModal] = useState(false);
  const [showPhraseModal, setShowPhraseModal] = useState(false);
  const [editingWord, setEditingWord] = useState<WordBankEntry | null>(null);
  const [deletingWord, setDeletingWord] = useState<WordBankEntry | null>(null);
  const [activeExercises, setActiveExercises] = useState<PracticeExercise[] | null>(null);

  const editExistingWord = useCallback((wordId: string) => {
    const existing = words.find((word) => word.id === wordId);
    if (!existing) return;
    setShowWordModal(false);
    setEditingWord(existing);
  }, [words]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (showWordModal || showPhraseModal || event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable) return;
      if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        setShowWordModal(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showPhraseModal, showWordModal]);

  const filteredSources = useMemo(() => {
    // "ai_coach" filters by origin, not by kind — it cuts across words,
    // phrases and lessons alike.
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
          Boolean(word?.context?.toLowerCase().includes(q)) ||
          Boolean(word?.ipa?.toLowerCase().includes(q))
        );
      });
    }
    return list;
  }, [filter, reviewSources, searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredSources.length / PAGE_SIZE));

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const paginatedSources = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredSources.slice(start, start + PAGE_SIZE);
  }, [currentPage, filteredSources]);

  const reviewQueue = useMemo(
    () => buildTrackingReviewQueue(filteredSources),
    [filteredSources],
  );

  const availableReviewCount = reviewQueue.exercises?.length ?? 0;

  function startReview() {
    if (availableReviewCount === 0 || !reviewQueue.exercises) return;
    setActiveExercises(reviewQueue.exercises);
  }

  async function addPhrase() {
    const text = phrase.trim();
    if (!userId || !text) return;
    const context = phraseContext.trim();
    await saveTrackedItem({ userId, kind: "phrase", ref: text.toLocaleLowerCase(), title: text, payload: { text, ...(context ? { context } : {}) } });
    setPhrase("");
    setPhraseContext("");
    setShowPhraseModal(false);
  }

  function closePhraseModal() {
    setShowPhraseModal(false);
    setPhrase("");
    setPhraseContext("");
  }

  function handlePageChange(page: number) {
    setCurrentPage(page);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  }

  const canReview = availableReviewCount > 0;
  const hasCategoryItems =
    filter === "all"
      ? reviewSources.length > 0
      : filter === "ai_coach"
        ? reviewSources.some((s) => s.item.fromCoach)
        : reviewSources.some((s) => s.item.kind === filter);

  const content = (
    <>
      <div className="tracking-workspace">
        <aside className="tracking-capture" aria-label="Guardar contenido nuevo">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary"><BookmarkPlus size={20} aria-hidden /></span>
            <div>
              <h2 className="text-h4 text-fg">Añadir a mi lista</h2>
              <p className="mt-0.5 text-caption text-fg-muted">Guarda vocabulario o frases para repasar</p>
            </div>
          </div>
          <div className="tracking-capture__actions">
            <Button fullWidth onClick={() => setShowWordModal(true)} icon={<Plus size={16} aria-hidden />}>Guardar palabra</Button>
            <Button fullWidth variant="secondary" onClick={() => setShowPhraseModal(true)} icon={<FileText size={16} aria-hidden />}>Guardar frase</Button>
          </div>
          <p className="mt-[var(--layout-stack)] hidden sm:flex items-center gap-1.5 text-caption text-fg-subtle">
            <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded-xs border border-border-subtle bg-surface-sunken px-1.5 font-mono text-caption text-fg">N</kbd>
            <span>abre captura de palabra</span>
          </p>
        </aside>
        <main className="tracking-workspace__content min-w-0">
          <TrackingToolbar
            filter={filter}
            onFilterChange={setFilter}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            canReview={canReview}
            availableReviewCount={availableReviewCount}
            startingReview={false}
            onStartReview={startReview}
          />
          {loading ? (
            <p className="text-body-sm text-fg-muted">Cargando contenido guardado…</p>
          ) : !hasCategoryItems ? (
            <TrackingEmptyState filter={filter} />
          ) : filteredSources.length === 0 ? (
            <div className="rounded-[var(--radius-md)] border border-border-subtle bg-surface-raised p-8 text-center">
              <p className="text-body-sm text-fg-muted">No se encontraron resultados para “{searchQuery}”.</p>
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="focus-ring mt-3 inline-flex items-center text-caption font-semibold text-primary underline-offset-2 hover:underline"
              >
                Restablecer búsqueda
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="tracking-list">
                {paginatedSources.map((source) => (
                  <TrackingCard key={`${source.item.kind}:${source.item.id}`} source={source} onEditWord={setEditingWord} onDeleteWord={setDeletingWord} />
                ))}
              </div>
              <ListPagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredSources.length}
                pageSize={PAGE_SIZE}
                onPageChange={handlePageChange}
                ariaLabel="Paginación de contenido guardado"
              />
            </div>
          )}
        </main>
      </div>
      <QuickAddModal open={showWordModal} onClose={() => setShowWordModal(false)} onSubmit={addWord} onEditExisting={editExistingWord} contextLabel="TRACKING" />
      <PhraseCaptureModal open={showPhraseModal} value={phrase} onChange={setPhrase} context={phraseContext} onContextChange={setPhraseContext} onClose={closePhraseModal} onSubmit={() => void addPhrase()} />
      <EditWordModal word={editingWord} onClose={() => setEditingWord(null)} onSubmit={updateWord} />
      <DeleteWordDialog word={deletingWord} onClose={() => setDeletingWord(null)} onConfirm={removeWord} />
    </>
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

  return (
    <PageLayout archetype="catalog">
      <PageHeader kicker="Tracking" title="Mi inglés" />
      {content}
    </PageLayout>
  );
}
