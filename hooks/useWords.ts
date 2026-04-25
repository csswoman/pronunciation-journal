"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  deleteWord as apiDeleteWord,
  getMyWords,
  incrementDifficulty as apiIncrementDifficulty,
  quickAddWord as apiQuickAddWord,
} from "@/lib/word-bank/queries";
import type { WordBankEntry } from "@/lib/types";

interface UseWordsState {
  words: WordBankEntry[];
  loading: boolean;
  error: string | null;
  addWord: (input: { text: string; context?: string | null }) => Promise<void>;
  removeWord: (id: string) => Promise<void>;
  markDifficult: (id: string) => Promise<void>;
  retry: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const POLL_INTERVAL_MS = 2500;
const POLL_TIMEOUT_MS = 60_000;

export function useWords(): UseWordsState {
  const { user } = useAuth();
  const [words, setWords] = useState<WordBankEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track when each processing word started, so polling can give up.
  const processingSinceRef = useRef<Map<string, number>>(new Map());
  const pendingAddRef = useRef<Map<string, string>>(new Map());

  function makePendingKey(text: string, context?: string | null) {
    return `${text.trim().toLowerCase()}::${(context ?? "").trim().toLowerCase()}`;
  }

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getMyWords();
      setWords(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load words");
    }
  }, [user]);

  // Initial load.
  useEffect(() => {
    if (!user) {
      setWords([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    getMyWords()
      .then(data => {
        if (cancelled) return;
        setWords(data);
        setError(null);
      })
      .catch(err => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load words");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  // Realtime subscription — picks up server-side enrichment updates.
  useEffect(() => {
    if (!user) return;
    const supabase = getSupabaseBrowserClient();

    const channel = supabase
      .channel(`word_bank:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "word_bank",
          filter: `user_id=eq.${user.id}`,
        },
        payload => {
          if (payload.eventType === "INSERT") {
            const next = payload.new as WordBankEntry;
            const pendingKey = makePendingKey(next.text, next.context);
            setWords(prev => {
              const tempId = pendingAddRef.current.get(pendingKey);
              if (tempId) {
                pendingAddRef.current.delete(pendingKey);
                return prev.map(w => (w.id === tempId ? next : w));
              }
              if (prev.some(w => w.id === next.id)) return prev;
              return [next, ...prev];
            });
          } else if (payload.eventType === "UPDATE") {
            const next = payload.new as WordBankEntry;
            setWords(prev => prev.map(w => (w.id === next.id ? next : w)));
            if (next.status !== "processing") {
              processingSinceRef.current.delete(next.id);
            }
          } else if (payload.eventType === "DELETE") {
            const old = payload.old as { id: string };
            setWords(prev => prev.filter(w => w.id !== old.id));
            processingSinceRef.current.delete(old.id);
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user]);

  // Polling fallback — in case realtime is disabled or the channel drops.
  useEffect(() => {
    const hasProcessing = words.some(w => w.status === "processing");
    if (!hasProcessing || !user) return;

    const interval = setInterval(() => {
      const now = Date.now();
      // Stop polling for words stuck > timeout — UI shows them as processing
      // and the user can hit retry manually.
      const timedOut: string[] = [];
      const stillWaiting = words.some(w => {
        if (w.status !== "processing") return false;
        if (!processingSinceRef.current.has(w.id)) {
          processingSinceRef.current.set(w.id, now);
        }
        const since = processingSinceRef.current.get(w.id)!;
        if (now - since >= POLL_TIMEOUT_MS) {
          timedOut.push(w.id);
          return false;
        }
        return true;
      });

      if (timedOut.length > 0) {
        setWords(prev =>
          prev.map(w =>
            timedOut.includes(w.id)
              ? { ...w, status: "failed", error_reason: "timeout" }
              : w
          )
        );
        timedOut.forEach(id => processingSinceRef.current.delete(id));
      }

      if (stillWaiting) void refresh();
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [words, user, refresh]);

  const addWord = useCallback(
    async (input: { text: string; context?: string | null }) => {
      if (!user) throw new Error("Not authenticated");

      const text = input.text.trim();
      if (!text) return;

      // Optimistic placeholder so the card appears instantly.
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const pendingKey = makePendingKey(text, input.context);
      pendingAddRef.current.set(pendingKey, tempId);
      const optimistic: WordBankEntry = {
        id: tempId,
        user_id: user.id,
        text,
        context: input.context ?? null,
        meaning: null,
        translation: null,
        ipa: null,
        example: null,
        synonyms: null,
        image_prompt: null,
        audio_url: null,
        status: "processing",
        difficulty: 0,
        error_reason: null,
        next_review_at: null,
        review_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setWords(prev => [optimistic, ...prev]);

      try {
        const real = await apiQuickAddWord({ text, context: input.context });
        pendingAddRef.current.delete(pendingKey);
        // Swap optimistic row for the real one.
        setWords(prev => {
          const withoutTemp = prev.filter(w => w.id !== tempId);
          if (withoutTemp.some(w => w.id === real.id)) {
            return withoutTemp.map(w => (w.id === real.id ? real : w));
          }
          if (withoutTemp.some(w => w.id === real.id)) return withoutTemp;
          return [real, ...withoutTemp];
        });
        processingSinceRef.current.set(real.id, Date.now());
      } catch (err) {
        // Roll back optimistic insert on failure.
        pendingAddRef.current.delete(pendingKey);
        setWords(prev => prev.filter(w => w.id !== tempId));
        throw err;
      }
    },
    [user]
  );

  const removeWord = useCallback(async (id: string) => {
    const snapshot = words;
    setWords(prev => prev.filter(w => w.id !== id));
    try {
      await apiDeleteWord(id);
    } catch (err) {
      setWords(snapshot);
      throw err;
    }
  }, [words]);

  const markDifficult = useCallback(async (id: string) => {
    const target = words.find(w => w.id === id);
    if (!target) return;

    const newDifficulty = target.difficulty > 0 ? 0 : 1;
    const optimistic = { ...target, difficulty: newDifficulty };
    setWords(prev => prev.map(w => (w.id === id ? optimistic : w)));

    try {
      const updated = await apiIncrementDifficulty(id, newDifficulty);
      setWords(prev => prev.map(w => (w.id === id ? updated : w)));
    } catch (err) {
      setWords(prev => prev.map(w => (w.id === id ? target : w)));
      throw err;
    }
  }, [words]);

  const retry = useCallback(async (id: string) => {
    const target = words.find(w => w.id === id);
    if (!target) return;

    // Mark as processing and clear error, then trigger enrichment.
    const processing: WordBankEntry = { ...target, status: "processing", error_reason: null };
    setWords(prev => prev.map(w => (w.id === id ? processing : w)));
    processingSinceRef.current.set(id, Date.now());

    try {
      const res = await fetch("/api/words", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, text: target.text, context: target.context }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to retry");
      }
    } catch (err) {
      setWords(prev => prev.map(w =>
        w.id === id
          ? { ...target, error_reason: "api_error" }
          : w
      ));
      throw err;
    }
  }, [words]);

  return { words, loading, error, addWord, removeWord, markDifficult, retry, refresh };
}
