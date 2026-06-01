"use client";

import { useCallback, useEffect, useState } from "react";

export interface WordOfDay {
  word: string;
  ipa: string;
  part_of_speech?: string;
  definition: string;
  example_sentence: string;
  difficulty: "beginner" | "intermediate" | "advanced";
}

const CACHE_KEY = "wod";
const CACHE_DATE_KEY = "wod_date";

export function useWordOfDay() {
  const [word, setWord] = useState<WordOfDay | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWord = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const url = forceRefresh
        ? `/api/gemini/word-of-day?refresh=1&t=${Date.now()}`
        : "/api/gemini/word-of-day";
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Error ${res.status}`);
      }
      const data: WordOfDay = await res.json();
      setWord(data);
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
      sessionStorage.setItem(CACHE_DATE_KEY, new Date().toISOString().slice(0, 10));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load word");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const cached = sessionStorage.getItem(CACHE_KEY);
    const cachedDate = sessionStorage.getItem(CACHE_DATE_KEY);
    if (cached && cachedDate === today) {
      setWord(JSON.parse(cached));
      setLoading(false);
      return;
    }
    fetchWord();
  }, [fetchWord]);

  return { word, loading, error, refresh: () => fetchWord(true) };
}
