"use client";

// Planned structure:
// <WordBrowser>
//   <WordFiltersBar />
//   <WordGrid />
//   <BackToTop button />
// </WordBrowser>

import { useState, useMemo, useCallback } from "react";
import { ArrowUp } from "lucide-react";
import { WordFiltersBar } from "./WordFiltersBar";
import { WordGrid } from "./WordGrid";
import type { Word } from "./WordGrid";
import type { StatusFilter, SortMode, ViewMode } from "./WordFiltersBar";
import { markLexiconWordLearned } from "@/lib/word-bank/queries";

interface WordBrowserProps {
  words: Word[];
  color?: string;
  categoryId: string;
}

export function WordBrowser({ words: initialWords, color, categoryId }: WordBrowserProps) {
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortMode>("alpha");
  const [view, setView] = useState<ViewMode>("grid");
  const [search, setSearch] = useState("");

  // Track per-word status overrides from optimistic "mark learned" actions.
  const [learnedIds, setLearnedIds] = useState<Set<string>>(
    () => new Set(initialWords.filter((w) => w.status === "learned").map((w) => w.id))
  );

  const words = useMemo(
    () => initialWords.map((w) => ({ ...w, status: learnedIds.has(w.id) ? ("learned" as const) : w.status })),
    [initialWords, learnedIds]
  );

  const handleMarkLearned = useCallback(
    async (wordId: string) => {
      // Find the word data from the initial list.
      const word = initialWords.find((w) => w.id === wordId);
      if (!word) return;

      // Optimistic update.
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
        // Roll back optimistic update on failure.
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

  const filtered = useMemo(() => {
    let result = words;

    if (status !== "all") {
      result = result.filter((w) => w.status === status);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (w) => w.word.toLowerCase().includes(q) || w.definition.toLowerCase().includes(q)
      );
    }

    if (sort === "difficulty") {
      result = [...result].sort((a, b) => b.difficulty - a.difficulty);
    } else {
      result = [...result].sort((a, b) => a.word.localeCompare(b.word));
    }

    return result;
  }, [words, status, sort, search]);

  return (
    <div className="space-y-6">
      <WordFiltersBar
        status={status}
        sort={sort}
        view={view}
        search={search}
        onStatusChange={setStatus}
        onSortChange={setSort}
        onViewChange={setView}
        onSearchChange={setSearch}
      />

      <WordGrid words={filtered} view={view} color={color} onMarkLearned={handleMarkLearned} />

      {/* Back to top */}
      <div className="flex justify-end pb-8">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="flex items-center gap-2 px-4 py-2 bg-fg text-surface-raised rounded-full text-sm font-medium shadow-md hover:opacity-90 transition-opacity"
        >
          <ArrowUp className="w-4 h-4" />
          Back to Lexicon
        </button>
      </div>
    </div>
  );
}
