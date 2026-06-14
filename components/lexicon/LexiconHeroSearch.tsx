"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Volume2 } from "lucide-react";
import { useLexiconIndex } from "@/hooks/useLexiconIndex";
import { useAudioPlayback } from "@/hooks/useAudioPlayback";
import Button from "@/components/ui/Button";
import type { LexiconSearchHit } from "@/lib/lexicon/types";
import { formatIpaDisplay } from "@/lib/lexicon/format-ipa";

const RECENT_KEY = "ej-lexicon-recent";
const MAX_RECENT = 4;

function loadRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function saveRecent(word: string) {
  const prev = loadRecent().filter((w) => w.toLowerCase() !== word.toLowerCase());
  const next = [word, ...prev].slice(0, MAX_RECENT);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  return next;
}

interface LexiconHeroSearchProps {
  totalWords: number;
  recentWords?: string[];
  dueWords?: string[];
  onAddWord?: (text: string) => void;
}

export function LexiconHeroSearch({
  totalWords,
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
    setRecentStored(loadRecent());
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
    setRecentStored(saveRecent(hit.word));
  }, []);

  const openCategory = useCallback(
    (hit: LexiconSearchHit) => {
      router.push(`/lexicon/${hit.categoryId}`);
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
      <p className="words-lexicon__hero-lede">
        {totalWords.toLocaleString()} words with definitions, pronunciation, and examples.
      </p>

      <div className="words-lexicon__searchwrap" ref={wrapRef}>
        <div className="words-lexicon__searchbox">
          <div className="words-lexicon__search-mag" aria-hidden>
            <Search size={16} strokeWidth={2} />
          </div>
          <input
            ref={inputRef}
            type="search"
            className="words-lexicon__search-input"
            placeholder="e.g. middleware, viewport, API gateway"
            value={query}
            autoComplete="off"
            aria-label="Search dictionary"
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

        <div
          id="lexicon-search-results"
          className={`words-lexicon__results${resultsOpen ? " is-open" : ""}`}
          aria-label="Search results"
        >
          {matches.length === 0 && query.trim() ? (
            <p className="words-lexicon__nores">
              No results for &ldquo;{query.trim()}&rdquo;. Try a different spelling or a broader term.
            </p>
          ) : (
            matches.map((hit, index) => (
              <button
                key={hit.id}
                type="button"
                className={`words-lexicon__res${focusedIndex === index ? " is-focused" : ""}`}
                aria-selected={focusedIndex === index}
                onClick={() => pick(hit)}
              >
                <span className="words-lexicon__res-word">{hit.word}</span>
                {hit.ipa ? (
                  <span className="words-lexicon__res-pos font-ipa text-primary">
                    {formatIpaDisplay(hit.ipa)}
                  </span>
                ) : (
                  <span className="words-lexicon__res-pos">{hit.pos}</span>
                )}
                <span className="words-lexicon__res-cat">{hit.categoryName}</span>
                {hit.translation ? (
                  <span className="words-lexicon__res-def words-lexicon__res-def--translation">
                    {hit.translation}
                  </span>
                ) : null}
                <span className="words-lexicon__res-def">{hit.definition}</span>
              </button>
            ))
          )}
        </div>
      </div>

      {(recentWords.length > 0 || dueWords.length > 0) && (
        <div className="words-lexicon__quick">
          {recentWords.length > 0 && (
            <>
              <span className="words-lexicon__quick-lbl">Recent:</span>
              {recentWords.map((w) => (
                <button
                  key={w}
                  type="button"
                  className="words-lexicon__qchip"
                  onClick={() => chipPick(w)}
                >
                  {w}
                </button>
              ))}
            </>
          )}
          {dueWords.length > 0 && (
            <>
              <span className="words-lexicon__quick-lbl words-lexicon__quick-lbl--spaced">
                To review:
              </span>
              {dueWords.map((w) => (
                <button
                  key={w}
                  type="button"
                  className="words-lexicon__qchip is-due"
                  onClick={() => chipPick(w)}
                >
                  {w}
                </button>
              ))}
            </>
          )}
        </div>
      )}

      {selected && (
        <div
          className="words-lexicon__worddetail is-open"
          role="region"
          aria-label="Word detail"
          aria-live="polite"
          aria-atomic="true"
        >
          <div className="words-lexicon__wd-top">
            <span className="words-lexicon__wd-w">{selected.word}</span>
            {selected.ipa ? (
              <span className="words-lexicon__wd-pos font-ipa">{formatIpaDisplay(selected.ipa)}</span>
            ) : (
              <span className="words-lexicon__wd-pos">{selected.pos}</span>
            )}
            <span className="words-lexicon__wd-cat">{selected.categoryName}</span>
            {selected.ipa && (
              <span
                className="words-lexicon__wd-cat"
                title="International Phonetic Alphabet — shows how to pronounce the word"
              >
                IPA
              </span>
            )}
          </div>
          {selected.translation ? (
            <p className="words-lexicon__wd-translation">{selected.translation}</p>
          ) : null}
          <p className="words-lexicon__wd-def">{selected.definition}</p>
          <div className="words-lexicon__wd-btns">
            <Button
              size="sm"
              icon={<Volume2 size={15} />}
              onClick={() => void play("normal")}
            >
              Hear it
            </Button>
            {onAddWord ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onAddWord(selected.word)}
              >
                Add to my words
              </Button>
            ) : null}
            <Button variant="ghost" size="sm" onClick={() => openCategory(selected)}>
              Open category
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
