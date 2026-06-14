"use client";

import { isWordOfDay, type WordOfDay } from "@/lib/word-of-day";
import { useCallback, useEffect, useRef, useState } from "react";

export type { WordOfDay };

const CACHE_KEY = "wod";
const CACHE_DATE_KEY = "wod_date";

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function readCachedWord(today: string): WordOfDay | null {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    const cachedDate = sessionStorage.getItem(CACHE_DATE_KEY);
    if (!cached || cachedDate !== today) return null;

    const parsed: unknown = JSON.parse(cached);
    if (isWordOfDay(parsed)) return parsed;
  } catch {
    // Ignore invalid cache entries
  }

  sessionStorage.removeItem(CACHE_KEY);
  sessionStorage.removeItem(CACHE_DATE_KEY);
  return null;
}

function writeCachedWord(data: WordOfDay): void {
  sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
  sessionStorage.setItem(CACHE_DATE_KEY, todayKey());
}

function clearCachedWord(): void {
  sessionStorage.removeItem(CACHE_KEY);
  sessionStorage.removeItem(CACHE_DATE_KEY);
}

export function useWordOfDay() {
  const [word, setWord] = useState<WordOfDay | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const wordRef = useRef<WordOfDay | null>(null);

  useEffect(() => {
    wordRef.current = word;
  }, [word]);

  const fetchWord = useCallback(async (forceRefresh = false) => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    try {
      const url = forceRefresh
        ? `/api/gemini/word-of-day?refresh=1&t=${Date.now()}`
        : "/api/gemini/word-of-day";
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        const body: unknown = await res.json().catch(() => ({}));
        const message =
          body && typeof body === "object" && "error" in body && typeof body.error === "string"
            ? body.error
            : `Error ${res.status}`;
        throw new Error(message);
      }

      const data: unknown = await res.json();
      if (!isWordOfDay(data)) {
        throw new Error("Invalid word-of-day response");
      }

      if (requestId !== requestIdRef.current) return;

      setWord(data);
      writeCachedWord(data);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;

      const cached = readCachedWord(todayKey());
      if (cached) {
        setWord(cached);
        setError(null);
        return;
      }

      if (wordRef.current) {
        setWord(wordRef.current);
        writeCachedWord(wordRef.current);
        setError(null);
        return;
      }

      clearCachedWord();
      setWord(null);
      setError(err instanceof Error ? err.message : "Couldn't load word");
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const cached = readCachedWord(todayKey());
    if (cached) {
      setWord(cached);
      setError(null);
      setLoading(false);
      return;
    }
    void fetchWord();
  }, [fetchWord]);

  return { word, loading, error, refresh: () => fetchWord(true) };
}
