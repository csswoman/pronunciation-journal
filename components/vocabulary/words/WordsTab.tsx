"use client";

import { useState, useEffect, useMemo } from "react";
import { Search } from "lucide-react";
import Card from "@/components/layout/Card";
import Button from "@/components/ui/Button";
import { WordCard } from "@/components/vocabulary/words/WordCard";
import { WordsEmptyState } from "@/components/vocabulary/words/WordsEmptyState";
import type { WordBankEntry } from "@/lib/word-bank/types";

const ITEMS_PER_PAGE = 12;
type WordFilter = "all" | "ready" | "processing";

interface WordStats {
  total: number;
  ready: number;
  processing: number;
}

interface WordsTabProps {
  words: WordBankEntry[];
  loading: boolean;
  error: string | null;
  actionError: string | null;
  wordStats: WordStats;
  selectedWordIds: Set<string>;
  selectMode: boolean;
  onToggleSelectMode: () => void;
  onToggleWordSelection: (id: string) => void;
  onRetry: (id: string) => void;
  onDelete: (id: string) => void;
  onOpenAddWord: (initialText?: string) => void;
}

export function WordsTab({
  words,
  loading,
  error,
  actionError,
  wordStats,
  selectedWordIds,
  selectMode,
  onToggleSelectMode,
  onToggleWordSelection,
  onRetry,
  onDelete,
  onOpenAddWord,
}: WordsTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<WordFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => { setCurrentPage(1); }, [filterType, searchQuery]);

  const filteredWords = useMemo(() => {
    let result = words;
    if (filterType === "ready") result = result.filter(w => w.status === "ready");
    else if (filterType === "processing") result = result.filter(w => w.status === "processing");
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(w =>
        w.text.toLowerCase().includes(q) ||
        w.translation?.toLowerCase().includes(q) ||
        w.meaning?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [words, filterType, searchQuery]);

  const totalPages = Math.ceil(filteredWords.length / ITEMS_PER_PAGE);
  const paginatedWords = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredWords.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredWords, currentPage]);

  return (
    <>
      {!loading && words.length > 0 && (
        <div className="flex items-center gap-2 my-4">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle opacity-60 pointer-events-none" />
            <input
              type="text"
              placeholder="Search words…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") {
                  const q = searchQuery.trim();
                  if (q && !words.some(w => w.text.toLowerCase() === q.toLowerCase())) {
                    setSearchQuery("");
                    onOpenAddWord(q);
                  }
                }
              }}
              className="w-full pl-8 pr-3 py-2 rounded-full text-sm text-fg placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_oklch,var(--primary)_20%,transparent)] border border-border-subtle bg-surface-sunken"
            />
          </div>

          <div className="flex items-center gap-1.5">
            {(["all", "ready", "processing"] as WordFilter[]).map(f => {
              const count =
                f === "all" ? wordStats.total :
                f === "ready" ? wordStats.ready :
                wordStats.processing;
              if (f === "processing" && count === 0) return null;
              const label =
                f === "all" ? "All" :
                f === "ready" ? "To review" :
                "Enriching";
              const isActive = filterType === f;
              return (
                <button
                  key={f}
                  onClick={() => setFilterType(f)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium border transition-colors"
                  style={{
                    background: isActive ? "var(--primary)" : "transparent",
                    borderColor: isActive ? "var(--primary)" : "var(--line-divider)",
                    color: isActive ? "var(--on-primary)" : "var(--text-secondary)",
                  }}
                >
                  {label}
                  <span
                    className="text-[12px] font-semibold tabular-nums"
                    style={{ opacity: isActive ? 0.85 : 1, color: isActive ? "var(--on-primary)" : "var(--text-secondary)" }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            onClick={onToggleSelectMode}
            className="text-[13px] text-fg-muted shrink-0 px-1 hover:text-fg transition-colors"
          >
            {selectMode ? "Cancel" : "Select"}
          </button>
        </div>
      )}

      {(error || actionError) && (
        <Card className="!p-3 border-[var(--error)]/40 bg-[color-mix(in_oklch,var(--error)_8%,var(--card-bg))]">
          <p className="text-sm text-[var(--error)]">{error ?? actionError}</p>
        </Card>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <Card key={i} className="h-20 rounded-2xl animate-pulse bg-surface-sunken">
              <div />
            </Card>
          ))}
        </div>
      ) : words.length === 0 ? (
        <WordsEmptyState onAdd={() => onOpenAddWord()} />
      ) : filteredWords.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-fg-muted">No words found matching your search or filter.</p>
        </Card>
      ) : (
        <>
          <div className="space-y-1.5">
            {paginatedWords.map(word => (
              <WordCard
                key={word.id}
                word={word}
                onRetry={onRetry}
                onDelete={onDelete}
                selected={selectedWordIds.has(word.id)}
                onSelect={selectMode ? onToggleWordSelection : undefined}
              />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-fg-muted">
                Page <span className="font-semibold">{currentPage}</span> of{" "}
                <span className="font-semibold">{totalPages}</span>
              </p>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                  Previous
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
