"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { ArrowUp, Dumbbell } from "@/components/icons";
import { PillButton } from "@/components/ui/PillButton";
import { WordFiltersBar } from "./WordFiltersBar";
import { WordGrid } from "./WordGrid";
import type { Word } from "./WordGrid";
import type { StatusFilter, SortMode, ViewMode } from "./WordFiltersBar";
import { markLexiconWordLearned } from "@/lib/word-bank/queries";

interface WordBrowserProps {
  words: Word[];
  categoryId: string;
  categoryTitle?: string;
  blurb?: string;
  wordBankMap?: Map<string, { id: string; isFavorite: boolean }>;
  onToggleFavorite?: (wordBankId: string, value: boolean) => void;
  onAddToMyWords?: (lexiconWord: {
    id: string;
    word: string;
    definition: string;
    example?: string;
  }) => void;
}

/**
 * WordBrowser - Navegador de palabras del tema del diccionario.
 *
 * Sub-componentes:
 * - HeaderFullColor (Cabecera en bloque de color sólido con título, blurb, barra de progreso y CTA)
 * - WordGrid (Rejilla principal de tarjetas de palabras)
 * - WordFiltersBar (Sidebar de búsqueda, filtrado por estado, ordenamiento y vista)
 * - PillButton (Botón "Volver arriba")
 */
export function WordBrowser({
  words: initialWords,
  categoryId,
  categoryTitle,
  blurb,
  wordBankMap,
  onToggleFavorite,
  onAddToMyWords,
}: WordBrowserProps) {
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortMode>("alpha");
  const [view, setView] = useState<ViewMode>("grid");
  const [search, setSearch] = useState("");

  const [learnedIds, setLearnedIds] = useState<Set<string>>(
    () => new Set(initialWords.filter((w) => w.status === "learned").map((w) => w.id))
  );

  const words = useMemo(
    () =>
      initialWords.map((w) => ({
        ...w,
        status: learnedIds.has(w.id) ? ("learned" as const) : w.status,
      })),
    [initialWords, learnedIds]
  );

  const handleMarkLearned = useCallback(
    async (wordId: string) => {
      const word = initialWords.find((w) => w.id === wordId);
      if (!word) return;

      setLearnedIds((prev) => new Set([...prev, wordId]));

      try {
        await markLexiconWordLearned({
          sourceRef: word.id,
          text: word.word,
          definition: word.definition,
          example: word.example ?? null,
          difficulty: word.difficulty,
        });
      } catch (err) {
        setLearnedIds((prev) => {
          const next = new Set(prev);
          next.delete(wordId);
          return next;
        });
        console.error("Failed to mark word as learned:", err);
      }
    },
    [initialWords]
  );

  const statusCounts = useMemo(
    () => ({
      all: words.length,
      learned: words.filter((w) => w.status === "learned").length,
      reviewing: words.filter((w) => w.status === "reviewing").length,
      new: words.filter((w) => w.status === "new").length,
    }),
    [words]
  );

  const filtered = useMemo(() => {
    let result = words;

    if (status !== "all") {
      result = result.filter((w) => w.status === status);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (w) =>
          w.word.toLowerCase().includes(q) ||
          w.definition.toLowerCase().includes(q) ||
          (w.translation?.toLowerCase().includes(q) ?? false)
      );
    }

    if (sort === "difficulty") {
      result = [...result].sort((a, b) => b.difficulty - a.difficulty || a.word.localeCompare(b.word));
    } else {
      result = [...result].sort((a, b) => a.word.localeCompare(b.word));
    }

    return result;
  }, [words, status, sort, search]);

  const enriched = filtered.map((word) => ({
    ...word,
    isFavorite: wordBankMap?.get(word.id)?.isFavorite ?? false,
    wordBankId: wordBankMap?.get(word.id)?.id ?? null,
    onToggleFavorite: wordBankMap?.get(word.id)?.id
      ? () =>
          onToggleFavorite?.(
            wordBankMap!.get(word.id)!.id,
            !wordBankMap!.get(word.id)!.isFavorite
          )
      : undefined,
    onAddToMyWords: !wordBankMap?.get(word.id)
      ? () =>
          onAddToMyWords?.({
            id: word.id,
            word: word.word,
            definition: word.definition,
            example: word.example,
          })
      : undefined,
    isInMyWords: !!wordBankMap?.get(word.id),
  }));

  const learnedPct = words.length > 0 ? Math.round((statusCounts.learned / words.length) * 100) : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Cabecera Full Color estilo Banner Destacado con Progreso Integrado a lo Ancho */}
      {categoryTitle ? (
        <header className="bg-primary text-on-primary rounded-2xl p-6 md:p-8 shadow-sm flex flex-col gap-6">
          {/* Fila superior: Título, Descripción y Botón de Práctica */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex flex-col gap-2">
              <nav className="flex items-center gap-1.5 font-mono text-tiny text-on-primary opacity-80 mb-0.5" aria-label="Ruta de navegación">
                <Link href="/words" className="hover:underline">Diccionario</Link>
                <span aria-hidden>/</span>
                <span aria-current="page">{categoryTitle}</span>
              </nav>

              <h1 className="text-h1 font-bold tracking-tight text-on-primary">{categoryTitle}</h1>
              {blurb ? <p className="text-body-md text-on-primary opacity-90 leading-relaxed max-w-2xl">{blurb}</p> : null}
            </div>

            <div className="shrink-0 self-stretch md:self-auto">
              <Link href={`/lexicon/${categoryId}/practice`} className="inline-block w-full md:w-auto">
                <button
                  type="button"
                  className="w-full md:w-auto px-6 py-3 bg-white text-primary font-semibold text-body-sm rounded-full shadow-md hover:bg-surface-raised transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Dumbbell size={16} aria-hidden />
                  Practicar este tema
                </button>
              </Link>
            </div>
          </div>

          {/* Fila inferior: Barra de progreso a lo ancho y métricas de palabras */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 border-t border-white/20">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 max-w-2xl">
              <div className="flex items-baseline gap-2 shrink-0">
                <span className="font-mono text-tiny uppercase tracking-wider text-on-primary opacity-85 font-medium">
                  Progreso
                </span>
                <strong className="text-h3 font-bold text-on-primary tabular-nums">{learnedPct}%</strong>
              </div>

              <div
                className="w-full h-2.5 rounded-full bg-white/20 overflow-hidden flex-1"
                role="progressbar"
                aria-label="Palabras aprendidas"
                aria-valuenow={statusCounts.learned}
                aria-valuemin={0}
                aria-valuemax={words.length}
              >
                <div
                  className="h-full bg-white rounded-full transition-all duration-300"
                  style={{ width: `${learnedPct}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-caption bg-white/15 backdrop-blur-xs font-medium text-on-primary">
                {statusCounts.learned} aprendidas
              </span>
              <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-caption bg-white/15 backdrop-blur-xs font-medium text-on-primary">
                {statusCounts.reviewing} en repaso
              </span>
              <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-caption bg-white/15 backdrop-blur-xs font-medium text-on-primary">
                {statusCounts.new} nuevas
              </span>
            </div>
          </div>
        </header>
      ) : null}

      {/* Disposición con resultados y sidebar conciso de búsqueda/filtros */}
      <div className="lexicon-area__detail-layout">
        {/* Columna principal de resultados */}
        <div className="lexicon-area__results flex flex-col gap-4">
          <p className="text-body-sm text-fg-subtle" aria-live="polite">
            {enriched.length} {enriched.length === 1 ? "palabra" : "palabras"} {status === "all" ? "en este tema" : "con este filtro"}
          </p>

          <WordGrid
            words={enriched}
            view={view}
            groupByLetter={sort === "alpha"}
            onMarkLearned={handleMarkLearned}
          />

          <div className="flex justify-center pt-8">
            <PillButton
              variant="outline"
              size="sm"
              icon={<ArrowUp className="w-4 h-4" />}
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              Volver arriba
            </PillButton>
          </div>
        </div>

        {/* Sidebar conciso fijos con búsqueda y filtros */}
        <aside className="lexicon-area__sidebar p-5 bg-surface-raised border border-border-subtle rounded-md sticky top-6">
          <WordFiltersBar
            variant="sidebar"
            status={status}
            sort={sort}
            view={view}
            search={search}
            counts={statusCounts}
            onStatusChange={setStatus}
            onSortChange={setSort}
            onViewChange={setView}
            onSearchChange={setSearch}
          />
        </aside>
      </div>
    </div>
  );
}

