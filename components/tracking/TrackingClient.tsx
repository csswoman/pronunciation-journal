"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, BookmarkPlus, BookOpen, FileText, Pencil, Play, Plus, Trash2 } from "@/components/icons";
import PageHeader from "@/components/layout/PageHeader";
import PageLayout from "@/components/layout/PageLayout";
import { useTracking } from "@/hooks/useTracking";
import { QuickAddModal } from "@/components/vocabulary/words/QuickAddModal";
import { TrackingEmptyState } from "./TrackingEmptyState";
import { PhraseCaptureModal } from "./PhraseCaptureModal";
import { EditWordModal } from "./EditWordModal";
import { DeleteWordDialog } from "./DeleteWordDialog";
import { saveTrackedItem } from "@/lib/tracking/queries";
import { buildTrackingReviewQueue } from "@/lib/tracking/review-queue";
import { createTrackingReviewSession } from "@/lib/tracking/session-store";
import Button from "@/components/ui/Button";
import type { TrackingReviewSource } from "@/lib/tracking/review-queue";
import type { TrackedKind } from "@/lib/tracking/types";
import type { WordBankEntry } from "@/lib/word-bank/types";

const FILTERS: { id: "all" | TrackedKind; label: string }[] = [
  { id: "all", label: "Todo" }, { id: "word", label: "Palabras" },
  { id: "phrase", label: "Frases" }, { id: "lesson", label: "Lecciones" },
];

const registry: Record<TrackedKind, { label: string; icon: typeof Bookmark }> = {
  word: { label: "Palabra", icon: Bookmark }, phrase: { label: "Frase", icon: FileText }, lesson: { label: "Lección", icon: BookOpen },
};

function TrackingCard({ source, onEditWord, onDeleteWord }: { source: TrackingReviewSource; onEditWord: (word: WordBankEntry) => void; onDeleteWord: (word: WordBankEntry) => void }) {
  const { item } = source;
  const entry = registry[item.kind];
  const Icon = entry.icon;
  const word = "word" in source ? source.word : null;
  const phraseContext = "trackedItem" in source && typeof source.trackedItem.payload.context === "string"
    ? source.trackedItem.payload.context
    : null;
  const content = <>
    <span className="self-start pt-0.5 text-fg-subtle"><Icon size={16} aria-hidden /></span>
    <span className="min-w-0">
      <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="text-body-sm font-semibold text-fg">{item.title}</span>
        {word?.ipa ? <span className="font-ipa text-body-sm text-fg-muted">/{word.ipa.replace(/^\/+|\/+$/g, "")}/</span> : null}
      </span>
      {word ? <>
        {word.translation ? <span className="block text-body-sm font-medium text-fg-muted">{word.translation}</span> : null}
        {word.meaning ? <span className="mt-0.5 block text-caption text-fg-subtle">{word.meaning}</span> : null}
        {word.context ? <span className="mt-2 block text-body-sm italic text-fg-muted">“{word.context}”</span> : null}
      </> : <>
        {phraseContext ? <span className="mt-1 block text-caption text-fg-subtle">Contexto: {phraseContext}</span> : null}
      </>}
    </span>
    <span className="flex shrink-0 items-start gap-1 text-caption text-fg-subtle"><span className="flex flex-col items-end gap-0.5 pt-2"><span>{entry.label}</span>{item.progressLabel && <span>{item.progressLabel}</span>}</span>{word ? <><button type="button" onClick={() => onEditWord(word)} aria-label={`Editar ${word.text}`} title="Editar palabra" className="flex min-h-11 min-w-11 items-center justify-center rounded-[var(--radius-sm)] text-fg-subtle transition-colors hover:bg-surface-sunken hover:text-fg active:scale-[0.96]"><Pencil size={16} aria-hidden /></button><button type="button" onClick={() => onDeleteWord(word)} aria-label={`Eliminar ${word.text}`} title="Eliminar palabra" className="flex min-h-11 min-w-11 items-center justify-center rounded-[var(--radius-sm)] text-fg-subtle transition-colors hover:bg-error-soft hover:text-error active:scale-[0.96]"><Trash2 size={16} aria-hidden /></button></> : null}</span>
  </>;
  return item.href ? <Link href={item.href} className="tracking-item">{content}</Link> : <div className="tracking-item">{content}</div>;
}

export default function TrackingClient() {
  const router = useRouter();
  const { reviewSources, loading, userId, addWord, removeWord, updateWord } = useTracking();
  const [filter, setFilter] = useState<"all" | TrackedKind>("all");
  const [phrase, setPhrase] = useState("");
  const [phraseContext, setPhraseContext] = useState("");
  const [showWordModal, setShowWordModal] = useState(false);
  const [showPhraseModal, setShowPhraseModal] = useState(false);
  const [editingWord, setEditingWord] = useState<WordBankEntry | null>(null);
  const [deletingWord, setDeletingWord] = useState<WordBankEntry | null>(null);

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
  const visibleSources = useMemo(
    () => filter === "all" ? reviewSources : reviewSources.filter((source) => source.item.kind === filter),
    [filter, reviewSources],
  );
  const availableReviewCount = useMemo(
    () => buildTrackingReviewQueue(visibleSources).items.length,
    [visibleSources],
  );
  const [startingReview, setStartingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  async function startReview() {
    if (!userId || visibleSources.length === 0 || startingReview) return;
    setStartingReview(true);
    setReviewError(null);
    try {
      const queue = buildTrackingReviewQueue(visibleSources);
      if (queue.items.length === 0) {
        setReviewError('No hay contenido disponible para practicar en esta selección.');
        return;
      }
      const session = await createTrackingReviewSession(userId, queue);
      router.push(`/tracking/review?session=${encodeURIComponent(session.id)}`);
    } catch {
      setReviewError('No pudimos preparar el repaso local. Inténtalo de nuevo.');
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

  const canReview = availableReviewCount > 0;

  return <PageLayout archetype="catalog"><PageHeader kicker="Tracking" title="Mi inglés" />
    <div className="tracking-workspace">
      <aside className="tracking-capture" aria-label="Guardar contenido nuevo">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary"><BookmarkPlus size={19} aria-hidden /></span>
          <div>
            <h2 className="text-h4 text-fg">Añadir a mi lista</h2>
          </div>
        </div>
        <div className="tracking-capture__actions">
          <Button fullWidth onClick={() => setShowWordModal(true)} icon={<Plus size={16} aria-hidden />}>Guardar palabra</Button>
          <Button fullWidth variant="secondary" onClick={() => setShowPhraseModal(true)} icon={<FileText size={16} aria-hidden />}>Guardar frase</Button>
        </div>
        <p className="mt-[var(--layout-stack)] text-caption text-fg-subtle"><kbd className="rounded-sm border border-border-subtle bg-surface-sunken px-1 font-mono text-fg">N</kbd> abre una palabra.</p>
      </aside>
      <main className="tracking-workspace__content min-w-0">
        {reviewError ? <p role="alert" className="mb-[var(--layout-stack)] text-body-sm text-error">{reviewError}</p> : null}
        <div className="tracking-toolbar"><div className="flex flex-wrap gap-2" aria-label="Filtrar contenido guardado">{FILTERS.map(({ id, label }) => <button key={id} type="button" onClick={() => setFilter(id)} aria-pressed={filter === id} className={filter === id ? "rounded-full bg-primary px-3 py-1.5 text-body-sm font-medium text-on-primary" : "rounded-full border border-border-subtle bg-surface-raised px-3 py-1.5 text-body-sm font-medium text-fg-muted transition-colors hover:bg-surface-sunken hover:text-fg"}>{label}</button>)}</div>{canReview ? <Button onClick={() => void startReview()} disabled={startingReview} icon={<Play size={15} aria-hidden />}>{startingReview ? "Preparando…" : "Repasar"}</Button> : null}</div>
        {loading ? <p className="text-body-sm text-fg-muted">Cargando contenido guardado…</p> : visibleSources.length ? <div className="tracking-list">{visibleSources.map((source) => <TrackingCard key={`${source.item.kind}:${source.item.id}`} source={source} onEditWord={setEditingWord} onDeleteWord={setDeletingWord} />)}</div> : <TrackingEmptyState filter={filter} />}
      </main>
    </div>
    <QuickAddModal open={showWordModal} onClose={() => setShowWordModal(false)} onSubmit={addWord} contextLabel="TRACKING" />
    <PhraseCaptureModal open={showPhraseModal} value={phrase} onChange={setPhrase} context={phraseContext} onContextChange={setPhraseContext} onClose={closePhraseModal} onSubmit={() => void addPhrase()} />
    <EditWordModal word={editingWord} onClose={() => setEditingWord(null)} onSubmit={updateWord} />
    <DeleteWordDialog word={deletingWord} onClose={() => setDeletingWord(null)} onConfirm={removeWord} />
  </PageLayout>;
}
