"use client";

import { useState, useMemo, useCallback } from "react";
import { ArrowUp } from "lucide-react";
import { WordFiltersBar } from "./WordFiltersBar";
import { WordGrid } from "./WordGrid";
import type { Word } from "./WordGrid";
import type { StatusFilter, SortMode, ViewMode } from "./WordFiltersBar";
import { markLexiconWordLearned } from "@/lib/word-bank/queries";

interface WordBrowserProps {
  words: Word[];
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

  return (
    <div>
      <WordFiltersBar
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
          Back to top
        </button>
      </div>
    </div>
  );
}
