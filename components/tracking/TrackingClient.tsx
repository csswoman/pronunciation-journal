"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BookmarkPlus, FileText, Play, Plus, Search } from "@/components/icons";
import PageHeader from "@/components/layout/PageHeader";
import PageLayout from "@/components/layout/PageLayout";
import { useTracking } from "@/hooks/useTracking";
import { QuickAddModal } from "@/components/vocabulary/words/QuickAddModal";
import { TrackingEmptyState } from "./TrackingEmptyState";
import { TrackingCard } from "./TrackingCard";
import { PhraseCaptureModal } from "./PhraseCaptureModal";
import { EditWordModal } from "./EditWordModal";
import { DeleteWordDialog } from "./DeleteWordDialog";
import { saveTrackedItem } from "@/lib/tracking/queries";
import { buildTrackingReviewQueue } from "@/lib/tracking/review-queue";
import { createTrackingReviewSession } from "@/lib/tracking/session-store";
import Button from "@/components/ui/Button";
import { ListPagination } from "@/components/ui/ListPagination";
import type { TrackedKind } from "@/lib/tracking/types";
import type { WordBankEntry } from "@/lib/word-bank/types";

const FILTERS: { id: "all" | TrackedKind; label: string }[] = [
  { id: "all", label: "Todo" }, { id: "word", label: "Palabras" },
  { id: "phrase", label: "Frases" }, { id: "lesson", label: "Lecciones" },
];

const PAGE_SIZE = 15;

interface TrackingClientProps {
  embed?: boolean;
}

// Planned structure:
// <TrackingClient>
//   <TrackingWorkspace>
//     <TrackingCaptureAside: QuickAddWord + QuickAddPhrase + ShortcutBadge />
//     <TrackingContent: Toolbar (Filters + Search + Review) + TrackingList + ListPagination />
//   </TrackingWorkspace>
//   <Modals: QuickAddModal + PhraseCaptureModal + EditWordModal + DeleteWordDialog />
// </TrackingClient>
export default function TrackingClient({ embed = false }: TrackingClientProps) {
  const router = useRouter();
  const { reviewSources, loading, userId, words, addWord, removeWord, updateWord } = useTracking();
  const [filter, setFilter] = useState<"all" | TrackedKind>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [phrase, setPhrase] = useState("");
  const [phraseContext, setPhraseContext] = useState("");
  const [showWordModal, setShowWordModal] = useState(false);
  const [showPhraseModal, setShowPhraseModal] = useState(false);
  const [editingWord, setEditingWord] = useState<WordBankEntry | null>(null);
  const [deletingWord, setDeletingWord] = useState<WordBankEntry | null>(null);
  const [startingReview, setStartingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

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
    let list = filter === "all" ? reviewSources : reviewSources.filter((s) => s.item.kind === filter);
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

  const availableReviewCount = useMemo(
    () => buildTrackingReviewQueue(filteredSources).items.length,
    [filteredSources],
  );

  async function startReview() {
    if (!userId || filteredSources.length === 0 || startingReview) return;
    setStartingReview(true);
    setReviewError(null);
    try {
      const queue = buildTrackingReviewQueue(filteredSources);
      if (queue.items.length === 0) {
        setReviewError("No hay contenido disponible para practicar en esta selección.");
        return;
      }
      const session = await createTrackingReviewSession(userId, queue);
      router.push(`/tracking/review?session=${encodeURIComponent(session.id)}`);
    } catch {
      setReviewError("No pudimos preparar el repaso local. Inténtalo de nuevo.");
    } finally {
      setStartingReview(false);
    }
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
  const hasCategoryItems = filter === "all" ? reviewSources.length > 0 : reviewSources.some((s) => s.item.kind === filter);

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
          <p className="mt-[var(--layout-stack)] flex items-center gap-1.5 text-caption text-fg-subtle">
            <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded-xs border border-border-subtle bg-surface-sunken px-1.5 font-mono text-caption text-fg">N</kbd>
            <span>abre captura de palabra</span>
          </p>
        </aside>
        <main className="tracking-workspace__content min-w-0">
          {reviewError ? <p role="alert" className="mb-[var(--layout-stack)] text-body-sm text-error">{reviewError}</p> : null}
          <div className="tracking-toolbar">
            <div className="flex flex-wrap items-center gap-2" aria-label="Filtrar contenido guardado">
              {FILTERS.map(({ id, label }) => (
                <button key={id} type="button" onClick={() => setFilter(id)} aria-pressed={filter === id} className={filter === id ? "rounded-full bg-primary px-3 py-1.5 text-body-sm font-medium text-on-primary" : "rounded-full border border-border-subtle bg-surface-raised px-3 py-1.5 text-body-sm font-medium text-fg-muted transition-colors hover:bg-surface-sunken hover:text-fg"}>{label}</button>
              ))}
            </div>
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
              <div className="relative min-w-0 flex-1 sm:w-56">
                <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle" aria-hidden />
                <input
                  type="search"
                  placeholder="Buscar en guardados…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Buscar en guardados"
                  className="h-9 w-full rounded-[var(--radius-sm)] border border-border-subtle bg-surface-sunken py-1.5 pl-8 pr-3 text-body-sm text-fg placeholder:text-fg-subtle outline-none transition-[border-color,box-shadow] duration-150 focus:border-[var(--border-focus)] focus:shadow-[0_0_0_3px_var(--focus-color)]"
                />
              </div>
              {canReview ? <Button onClick={() => void startReview()} disabled={startingReview} icon={<Play size={15} aria-hidden />}>{startingReview ? "Preparando…" : "Repasar"}</Button> : null}
            </div>
          </div>
          {loading ? (
            <p className="text-body-sm text-fg-muted">Cargando contenido guardado…</p>
          ) : !hasCategoryItems ? (
            <TrackingEmptyState filter={filter} />
          ) : filteredSources.length === 0 ? (
            <div className="rounded-[var(--radius-md)] border border-border-subtle bg-surface-raised p-8 text-center">
              <p className="text-body-sm text-fg-muted">No se encontraron resultados para “{searchQuery}”.</p>
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

  if (embed) return content;

  return (
    <PageLayout archetype="catalog">
      <PageHeader kicker="Tracking" title="Mi inglés" />
      {content}
    </PageLayout>
  );
}
