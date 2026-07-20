"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { ArrowUp, BookMarked, BookOpen, Dumbbell, Layers } from "@/components/icons";
import { WordFiltersBar } from "./WordFiltersBar";
import { WordGrid } from "./WordGrid";
import type { Word } from "./WordGrid";
import type { StatusFilter, SortMode, ViewMode } from "./WordFiltersBar";
import { markLexiconWordLearned } from "@/lib/word-bank/queries";

interface WordBrowserProps {
  words: Word[];
  categoryId: string;
  wordBankMap?: Map<string, { id: string; isFavorite: boolean }>;
  onToggleFavorite?: (wordBankId: string, value: boolean) => void;
  onAddToMyWords?: (lexiconWord: {
    id: string;
    word: string;
    definition: string;
    example?: string;
  }) => void;
}

export function WordBrowser({
  words: initialWords,
  categoryId,
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
    <div className="lexicon-area__detail-layout">
      <aside className="lexicon-area__sidebar" aria-label="Opciones del diccionario">
        <section className="lexicon-area__side-progress" aria-labelledby="dictionary-progress-title">
          <div className="lexicon-area__side-progress-head">
            <p id="dictionary-progress-title" className="lexicon-area__side-label">Progreso del tema</p>
            <strong>{learnedPct}%</strong>
          </div>
          <div
            className="lexicon-area__segbar"
            role="progressbar"
            aria-label="Palabras aprendidas"
            aria-valuenow={statusCounts.learned}
            aria-valuemin={0}
            aria-valuemax={words.length}
          >
            <i className="lexicon-area__segbar-learned" style={{ width: `${learnedPct}%` }} />
          </div>
          <p className="lexicon-area__side-progress-copy">
            <strong>{statusCounts.learned}</strong> de {words.length} palabras aprendidas
          </p>
          <div className="lexicon-area__side-legend">
            <span><i className="is-learned" />Aprendidas {statusCounts.learned}</span>
            <span><i className="is-reviewing" />En repaso {statusCounts.reviewing}</span>
            <span><i />Nuevas {statusCounts.new}</span>
          </div>
          <Link href={`/dictionary/${categoryId}/practice`} className="lexicon-area__practice-link">
            <Dumbbell size={16} aria-hidden /> Practicar este tema
          </Link>
        </section>

        <nav className="lexicon-area__side-nav" aria-label="Dictionary">
          <p className="lexicon-area__side-label">Dictionary</p>
          <Link href="/dictionary"><BookOpen size={16} aria-hidden /> Explorar temas</Link>
          <Link href="/dictionary?mode=learn"><Layers size={16} aria-hidden /> Plan de aprendizaje</Link>
          <Link href="/tracking"><BookMarked size={16} aria-hidden /> Palabras guardadas</Link>
        </nav>

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

      <div className="lexicon-area__results">
        <p className="lexicon-area__results-count" aria-live="polite">
          {enriched.length} {enriched.length === 1 ? "palabra" : "palabras"} {status === "all" ? "en este tema" : "con este filtro"}
        </p>
        <WordGrid
          words={enriched}
          view={view}
          groupByLetter={sort === "alpha"}
          onMarkLearned={handleMarkLearned}
        />

        <div className="lexicon-area__backtop">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <ArrowUp className="w-4 h-4" aria-hidden />
            Volver arriba
          </button>
        </div>
      </div>
    </div>
  );
}
