"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "@/components/icons";
import { useLexiconIndex } from "@/hooks/useLexiconIndex";
import { useAudioPlayback } from "@/hooks/useAudioPlayback";
import type { LexiconSearchHit } from "@/lib/lexicon/types";
import { loadLexiconRecent, saveLexiconRecent } from "./lexicon-recent";
import { LexiconSearchResults } from "./LexiconSearchResults";
import { LexiconQuickChips } from "./LexiconQuickChips";
import { LexiconWordDetail } from "./LexiconWordDetail";

interface LexiconHeroSearchProps {
  recentWords?: string[];
  dueWords?: string[];
  onAddWord?: (text: string) => void;
}

export function LexiconHeroSearch({
  recentWords: recentFallback = [],
  dueWords = [],
  onAddWord,
}: LexiconHeroSearchProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<LexiconSearchHit | null>(null);
  const [resultsOpen, setResultsOpen] = useState(false);
  const [recentStored, setRecentStored] = useState<string[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [isMac, setIsMac] = useState(false);
  const { index } = useLexiconIndex();

  useEffect(() => {
    setRecentStored(loadLexiconRecent());
  }, []);

  useEffect(() => {
    setIsMac(
      navigator.platform.toUpperCase().includes("MAC") ||
        navigator.userAgent.includes("Mac"),
    );
  }, []);

  const recentWords = recentStored.length > 0 ? recentStored : recentFallback;
  const { play } = useAudioPlayback(null, selected?.word ?? "");

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return index
      .filter(
        (w) =>
          w.word.toLowerCase().includes(q) ||
          w.definition.toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [query, index]);

  const pick = useCallback((hit: LexiconSearchHit) => {
    setQuery(hit.word);
    setSelected(hit);
    setResultsOpen(false);
    setRecentStored(saveLexiconRecent(hit.word));
  }, []);

  const openCategory = useCallback(
    (hit: LexiconSearchHit) => {
      router.push(`/dictionary/${hit.categoryId}`);
    },
    [router]
  );

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setResultsOpen(false);
      }
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // The shell owns Cmd/Ctrl+K. Its document listener prevents this event
      // before it bubbles here, avoiding two search surfaces opening at once.
      if (e.defaultPrevented) return;
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const chipPick = (word: string) => {
    const hit = index.find((w) => w.word.toLowerCase() === word.toLowerCase());
    if (hit) pick(hit);
    else {
      setQuery(word);
      setSelected(null);
    }
  };

  return (
    <div className="words-lexicon__hero">
      <div className="words-lexicon__searchwrap" ref={wrapRef}>
        <div className="words-lexicon__searchbox">
          <div className="words-lexicon__search-mag" aria-hidden>
            <Search size={16} strokeWidth={2} />
          </div>
          <input
            ref={inputRef}
            type="search"
            className="words-lexicon__search-input"
            placeholder="Ej.: understand, workflow, travel"
            value={query}
            autoComplete="off"
            aria-label="Buscar palabras"
            aria-expanded={resultsOpen}
            aria-controls="lexicon-search-results"
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(null);
              setResultsOpen(e.target.value.trim().length > 0);
              setFocusedIndex(-1);
            }}
            onFocus={() => {
              if (query.trim()) setResultsOpen(true);
            }}
            onKeyDown={(e) => {
              if (!resultsOpen || matches.length === 0) return;
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setFocusedIndex((i) => Math.min(i + 1, matches.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setFocusedIndex((i) => Math.max(i - 1, -1));
              } else if (e.key === "Enter" && focusedIndex >= 0) {
                e.preventDefault();
                pick(matches[focusedIndex]);
                setFocusedIndex(-1);
              } else if (e.key === "Escape") {
                setResultsOpen(false);
                setFocusedIndex(-1);
              }
            }}
          />
          <span className="words-lexicon__search-kbd" aria-hidden>
            {isMac ? "⌘K" : "Ctrl+K"}
          </span>
        </div>

        <LexiconSearchResults
          open={resultsOpen}
          query={query}
          matches={matches}
          focusedIndex={focusedIndex}
          onPick={pick}
        />
      </div>

      <LexiconQuickChips
        recentWords={recentWords}
        dueWords={dueWords}
        onChipPick={chipPick}
      />

      {selected && (
        <LexiconWordDetail
          selected={selected}
          onPlay={() => void play("normal")}
          onAddWord={onAddWord}
          onOpenCategory={openCategory}
        />
      )}
    </div>
  );
}
