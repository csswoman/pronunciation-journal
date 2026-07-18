"use client";

import { isWordOfDay, type WordOfDay } from "@/lib/word-of-day";
import { publicAiErrorMessage } from "@/lib/degradation/messages";
import { useCallback, useEffect, useRef, useState } from "react";

export type { WordOfDay };

const CACHE_KEY = "wod";
const CACHE_DATE_KEY = "wod_date";

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Cache identity: day, plus level when scoped, so levels don't share a word. */
function cacheStamp(level?: string): string {
  return level ? `${todayKey()}|${level.toUpperCase()}` : todayKey();
}

function readCachedWord(stamp: string): WordOfDay | null {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    const cachedStamp = sessionStorage.getItem(CACHE_DATE_KEY);
    if (!cached || cachedStamp !== stamp) return null;

    const parsed: unknown = JSON.parse(cached);
    if (isWordOfDay(parsed)) return parsed;
  } catch {
    // Ignore invalid cache entries
  }

  sessionStorage.removeItem(CACHE_KEY);
  sessionStorage.removeItem(CACHE_DATE_KEY);
  return null;
}

function writeCachedWord(data: WordOfDay, stamp: string): void {
  sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
  sessionStorage.setItem(CACHE_DATE_KEY, stamp);
}

function clearCachedWord(): void {
  sessionStorage.removeItem(CACHE_KEY);
  sessionStorage.removeItem(CACHE_DATE_KEY);
}

export function useWordOfDay(level?: string) {
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

    const stamp = cacheStamp(level);
    try {
      const params = new URLSearchParams();
      if (forceRefresh) {
        params.set("refresh", "1");
        params.set("t", String(Date.now()));
      }
      if (level) params.set("level", level);
      const qs = params.toString();
      const url = qs ? `/api/gemini/word-of-day?${qs}` : "/api/gemini/word-of-day";
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        const body: unknown = await res.json().catch(() => ({}));
        const message = body && typeof body === "object" && "error" in body && typeof body.error === "string"
          ? body.error
          : "";
        throw new Error(publicAiErrorMessage(res.status, message));
      }

      const data: unknown = await res.json();
      if (!isWordOfDay(data)) {
        throw new Error("Invalid word-of-day response");
      }

      if (requestId !== requestIdRef.current) return;

      setWord(data);
      writeCachedWord(data, stamp);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;

      const cached = readCachedWord(stamp);
      if (cached) {
        setWord(cached);
        setError(null);
        return;
      }

      if (wordRef.current) {
        setWord(wordRef.current);
        writeCachedWord(wordRef.current, stamp);
        setError(null);
        return;
      }

      clearCachedWord();
      setWord(null);
      setError(publicAiErrorMessage(undefined, err instanceof Error ? err.message : ""));
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [level]);

  useEffect(() => {
    const cached = readCachedWord(cacheStamp(level));
    if (cached) {
      setWord(cached);
      setError(null);
      setLoading(false);
      return;
    }
    void fetchWord();
  }, [fetchWord, level]);

  return { word, loading, error, refresh: () => fetchWord(true) };
}
