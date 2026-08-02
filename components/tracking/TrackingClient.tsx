"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, BookmarkPlus, BookOpen, FileText, Play, Plus } from "@/components/icons";
import PageHeader from "@/components/layout/PageHeader";
import PageLayout from "@/components/layout/PageLayout";
import { useTracking } from "@/hooks/useTracking";
import { QuickAddModal } from "@/components/vocabulary/words/QuickAddModal";
import { TrackingEmptyState } from "./TrackingEmptyState";
import { PhraseCaptureModal } from "./PhraseCaptureModal";
import { saveTrackedItem } from "@/lib/tracking/queries";
import { buildTrackingReviewQueue } from "@/lib/tracking/review-queue";
import { createTrackingReviewSession } from "@/lib/tracking/session-store";
import Button from "@/components/ui/Button";
import type { TrackedKind, TrackingItem } from "@/lib/tracking/types";

const FILTERS: { id: "all" | TrackedKind; label: string }[] = [
  { id: "all", label: "Todo" }, { id: "word", label: "Palabras" },
  { id: "phrase", label: "Frases" }, { id: "lesson", label: "Lecciones" },
];

const registry: Record<TrackedKind, { label: string; icon: typeof Bookmark }> = {
  word: { label: "Palabra", icon: Bookmark }, phrase: { label: "Frase", icon: FileText }, lesson: { label: "Lección", icon: BookOpen },
};

function TrackingCard({ item }: { item: TrackingItem }) {
  const entry = registry[item.kind];
  const Icon = entry.icon;
  const content = <><span className="text-fg-subtle"><Icon size={16} aria-hidden /></span><span className="min-w-0"><span className="block text-body-sm font-semibold text-fg">{item.title}</span>{item.description && <span className="block truncate text-body-sm text-fg-muted">{item.description}</span>}</span><span className="flex shrink-0 flex-col items-end gap-0.5 text-caption text-fg-subtle"><span>{entry.label}</span>{item.progressLabel && <span>{item.progressLabel}</span>}</span></>;
  return item.href ? <Link href={item.href} className="tracking-item">{content}</Link> : <div className="tracking-item">{content}</div>;
}

export default function TrackingClient() {
  const router = useRouter();
  const { items, reviewSources, loading, userId, addWord } = useTracking();
  const [filter, setFilter] = useState<"all" | TrackedKind>("all");
  const [phrase, setPhrase] = useState("");
  const [showWordModal, setShowWordModal] = useState(false);
  const [showPhraseModal, setShowPhraseModal] = useState(false);

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
  const visible = useMemo(() => filter === "all" ? items : items.filter((item) => item.kind === filter), [filter, items]);
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
    await saveTrackedItem({ userId, kind: "phrase", ref: text.toLocaleLowerCase(), title: text, payload: { text } });
    setPhrase("");
    setShowPhraseModal(false);
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
        {loading ? <p className="text-body-sm text-fg-muted">Cargando contenido guardado…</p> : visible.length ? <div className="tracking-list">{visible.map((item) => <TrackingCard key={`${item.kind}:${item.id}`} item={item} />)}</div> : <TrackingEmptyState filter={filter} />}
      </main>
    </div>
    <QuickAddModal open={showWordModal} onClose={() => setShowWordModal(false)} onSubmit={addWord} contextLabel="TRACKING" />
    <PhraseCaptureModal open={showPhraseModal} value={phrase} onChange={setPhrase} onClose={() => setShowPhraseModal(false)} onSubmit={() => void addPhrase()} />
  </PageLayout>;
}
