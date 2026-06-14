"use client";

import { useMemo, useState, useEffect } from "react";
import type { WordBankEntry } from "@/lib/word-bank/types";

export interface WordSearchResult {
  id: string;
  text: string;
  meaning: string | null;
  source: "my-words" | "lexicon";
  wordBankId?: string;
}

interface LexiconIndexEntry {
  id: string;
  word: string;
  definition: string;
  example?: string;
}

// Module-level cache so we only fetch once per session
let lexiconCache: LexiconIndexEntry[] | null = null;

export function useWordSearch(query: string, myWords: WordBankEntry[]) {
  const [lexiconIndex, setLexiconIndex] = useState<LexiconIndexEntry[]>(lexiconCache ?? []);

  useEffect(() => {
    if (query.length < 2 || lexiconCache) return;
    fetch("/lexicon/index.json")
      .then(r => r.json())
      .then((categories: Array<{ id: string }>) =>
        Promise.all(
          categories.map(cat =>
            fetch(`/lexicon/${cat.id}.json`).then(r => r.json())
          )
        )
      )
      .then((arrays: LexiconIndexEntry[][]) => {
        const flat = arrays.flat();
        lexiconCache = flat;
        setLexiconIndex(flat);
      })
      .catch(() => {/* silent — lexicon search is best-effort */});
  }, [query.length >= 2]);

  const results = useMemo<WordSearchResult[]>(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();

    const myWordResults: WordSearchResult[] = myWords
      .filter(w => w.text.toLowerCase().includes(q) || (w.meaning ?? "").toLowerCase().includes(q))
      .slice(0, 10)
      .map(w => ({
        id: w.id,
        text: w.text,
        meaning: w.meaning ?? null,
        source: "my-words" as const,
        wordBankId: w.id,
      }));

    const myWordTexts = new Set(myWords.map(w => w.text.toLowerCase()));

    const lexiconResults: WordSearchResult[] = lexiconIndex
      .filter(
        w =>
          !myWordTexts.has(w.word.toLowerCase()) &&
          (w.word.toLowerCase().includes(q) || w.definition.toLowerCase().includes(q))
      )
      .slice(0, 10)
      .map(w => ({
        id: w.id,
        text: w.word,
        meaning: w.definition,
        source: "lexicon" as const,
      }));

    return [...myWordResults, ...lexiconResults];
  }, [query, myWords, lexiconIndex]);

  return results;
}
