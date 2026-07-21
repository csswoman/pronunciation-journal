"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, BookOpen, FileText, Play } from "@/components/icons";
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
  const content = <><span className="text-fg-subtle"><Icon size={16} aria-hidden /></span><span className="min-w-0"><span className="block text-sm font-semibold text-fg">{item.title}</span>{item.description && <span className="block truncate text-sm text-fg-muted">{item.description}</span>}</span><span className="ml-auto flex shrink-0 flex-col items-end gap-0.5 text-xs text-fg-subtle"><span>{entry.label}</span>{item.progressLabel && <span>{item.progressLabel}</span>}</span></>;
  return item.href ? <Link href={item.href} className="flex items-center gap-3 rounded-[var(--radius-md)] border border-border-subtle bg-surface-raised px-4 py-3 transition-colors hover:bg-surface-sunken">{content}</Link> : <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-border-subtle bg-surface-raised px-4 py-3">{content}</div>;
}

export default function TrackingClient() {
  const router = useRouter();
  const { items, reviewSources, loading, userId, addWord } = useTracking();
  const [filter, setFilter] = useState<"all" | TrackedKind>("all");
  const [phrase, setPhrase] = useState("");
  const [showWordModal, setShowWordModal] = useState(false);
  const [showPhraseModal, setShowPhraseModal] = useState(false);
  const visible = useMemo(() => filter === "all" ? items : items.filter((item) => item.kind === filter), [filter, items]);
  const visibleSources = useMemo(
    () => filter === "all" ? reviewSources : reviewSources.filter((source) => source.item.kind === filter),
    [filter, reviewSources],
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

  return <PageLayout><PageHeader kicker="Tracking" title="Contenido guardado" subtitle="Palabras, frases y lecciones que quieres volver a practicar." primaryCta={{ label: startingReview ? "Preparando…" : "Repasar", icon: <Play size={15} aria-hidden />, onClick: () => void startReview() }} />
    <div className="mb-6 flex flex-wrap gap-2"><Button onClick={() => setShowWordModal(true)}>Agregar palabra</Button><Button variant="secondary" onClick={() => setShowPhraseModal(true)}>Agregar frase</Button></div>
    {reviewError ? <p role="alert" className="mb-5 text-sm text-fg-muted">{reviewError}</p> : null}
    <div className="mb-6 flex flex-wrap gap-2" aria-label="Filtrar contenido guardado">{FILTERS.map(({ id, label }) => <button key={id} type="button" onClick={() => setFilter(id)} aria-pressed={filter === id} className={filter === id ? "rounded-full bg-primary px-3 py-1.5 text-sm font-medium text-on-primary" : "rounded-full border border-border-subtle px-3 py-1.5 text-sm font-medium text-fg-muted hover:text-fg"}>{label}</button>)}</div>
    {loading ? <p className="text-sm text-fg-muted">Cargando contenido guardado…</p> : visible.length ? <div className="space-y-3">{visible.map((item) => <TrackingCard key={`${item.kind}:${item.id}`} item={item} />)}</div> : <TrackingEmptyState filter={filter} onAddWord={() => setShowWordModal(true)} onAddPhrase={() => setShowPhraseModal(true)} />}
    <QuickAddModal open={showWordModal} onClose={() => setShowWordModal(false)} onSubmit={addWord} />
    <PhraseCaptureModal open={showPhraseModal} value={phrase} onChange={setPhrase} onClose={() => setShowPhraseModal(false)} onSubmit={() => void addPhrase()} />
  </PageLayout>;
}
