"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchChunk } from "@/lib/essential-words/client";
import type { CatalogIndexEntry } from "@/lib/essential-words/catalog-index";
import { essentialWordId, type EssentialWord } from "@/lib/essential-words/types";

interface UseTriageCatalogCardsOptions {
  currentEntry?: CatalogIndexEntry;
  nextEntry?: CatalogIndexEntry;
}

export function useTriageCatalogCards({ currentEntry, nextEntry }: UseTriageCatalogCardsOptions) {
  const [resolvedWords, setResolvedWords] = useState<Record<string, EssentialWord>>({});
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const resolvedRef = useRef<Record<string, EssentialWord>>({});

  const currentWordId = currentEntry ? essentialWordId(currentEntry.word) : undefined;
  const nextWordId = nextEntry ? essentialWordId(nextEntry.word) : undefined;
  const current = currentWordId ? resolvedWords[currentWordId] : undefined;
  const nextWord = nextWordId ? resolvedWords[nextWordId] : undefined;
  const isLoading = Boolean(currentEntry && !current && !error);

  useEffect(() => {
    let cancelled = false;
    if (!currentEntry) {
      setError(null);
      return;
    }

    const currentId = essentialWordId(currentEntry.word);
    if (resolvedRef.current[currentId]) setError(null);
    const entries = [currentEntry, nextEntry].filter(
      (entry): entry is CatalogIndexEntry => Boolean(entry),
    );
    const missing = entries.filter((entry) => !resolvedRef.current[essentialWordId(entry.word)]);
    const chunks = Array.from(new Set(missing.map((entry) => entry.chunk)));
    if (chunks.length === 0) return;

    Promise.all(chunks.map((chunk) => fetchChunk(chunk)))
      .then((loadedChunks) => {
        if (cancelled) return;
        const wanted = new Set(missing.map((entry) => essentialWordId(entry.word)));
        const loadedById: Record<string, EssentialWord> = {};
        for (const words of loadedChunks) {
          for (const word of words) {
            const id = essentialWordId(word.word);
            if (wanted.has(id)) loadedById[id] = word;
          }
        }
        if (!resolvedRef.current[currentId] && !loadedById[currentId]) {
          throw new Error(`No se encontró ${currentEntry.word} en el chunk ${currentEntry.chunk}.`);
        }
        resolvedRef.current = { ...resolvedRef.current, ...loadedById };
        setResolvedWords((previous) => ({ ...previous, ...loadedById }));
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        console.error("[useTriageCatalogCards] card load error", err);
        if (!resolvedRef.current[currentId]) {
          setError(err instanceof Error ? err.message : "Error al cargar la palabra");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [currentEntry, nextEntry, retryKey]);

  const retry = useCallback(() => {
    setError(null);
    setRetryKey((previous) => previous + 1);
  }, []);

  return { current, nextWord, isLoading, error, retry };
}
