"use client";

import { useCallback, useRef, useState } from "react";

import { useAuth } from "@/components/auth/AuthProvider";
import { publicDataErrorMessage } from "@/lib/degradation/messages";
import { getAccessToken } from "@/lib/auth/session";
import { makePendingKey } from "@/lib/word-bank/apply-word-bank-change";
import { createOptimisticWord } from "@/hooks/word-bank/optimistic-word";
import { useWordBankInitialLoad } from "@/hooks/word-bank/useWordBankInitialLoad";
import { useWordBankProcessingPoll } from "@/hooks/word-bank/useWordBankProcessingPoll";
import { useWordBankRealtime } from "@/hooks/word-bank/useWordBankRealtime";
import {
  deleteWord as apiDeleteWord,
  getMyWords,
  quickAddWord as apiQuickAddWord,
} from "@/lib/word-bank/queries";
import type { WordBankEntry } from "@/lib/word-bank/types";

interface UseWordsState {
  words: WordBankEntry[];
  loading: boolean;
  error: string | null;
  addWord: (input: { text: string; context?: string | null; deckId?: string | null }) => Promise<void>;
  removeWord: (id: string) => Promise<void>;
  retry: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useWords(): UseWordsState {
  const { user } = useAuth();
  const [words, setWords] = useState<WordBankEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track when each processing word started, so polling can give up.
  const processingSinceRef = useRef<Map<string, number>>(new Map());
  const pendingAddRef = useRef<Map<string, string>>(new Map());

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getMyWords();
      setWords(data);
      setError(null);
    } catch {
      setError(publicDataErrorMessage());
    }
  }, [user]);

  useWordBankInitialLoad({
    enabled: Boolean(user),
    setWords,
    setLoading,
    setError,
  });

  useWordBankRealtime({
    userId: user?.id,
    pendingAddRef,
    processingSinceRef,
    setWords,
  });

  useWordBankProcessingPoll({
    enabled: Boolean(user),
    words,
    refresh,
    processingSinceRef,
    setWords,
  });

  const addWord = useCallback(
    async (input: { text: string; context?: string | null; deckId?: string | null }) => {
      if (!user) throw new Error("Not authenticated");

      const text = input.text.trim();
      if (!text) return;

      // Optimistic placeholder so the card appears instantly.
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const pendingKey = makePendingKey(text, input.context);
      pendingAddRef.current.set(pendingKey, tempId);

      const optimistic = createOptimisticWord({
        id: tempId,
        userId: user.id,
        text,
        context: input.context,
      });
      setWords((prev) => [optimistic, ...prev]);

      try {
        const real = await apiQuickAddWord({ text, context: input.context, deckId: input.deckId });
        pendingAddRef.current.delete(pendingKey);

        // Swap optimistic row for the real one.
        setWords((prev) => {
          const withoutTemp = prev.filter((word) => word.id !== tempId);
          if (withoutTemp.some((word) => word.id === real.id)) {
            return withoutTemp.map((word) => (word.id === real.id ? real : word));
          }
          return [real, ...withoutTemp];
        });

        processingSinceRef.current.set(real.id, Date.now());
      } catch {
        // Roll back optimistic insert on failure.
        pendingAddRef.current.delete(pendingKey);
        setWords((prev) => prev.filter((word) => word.id !== tempId));
        throw new Error(publicDataErrorMessage());
      }
    },
    [user]
  );

  const removeWord = useCallback(async (id: string) => {
    const snapshot = words;
    setWords((prev) => prev.filter((word) => word.id !== id));

    try {
      await apiDeleteWord(id);
    } catch {
      setWords(snapshot);
      throw new Error(publicDataErrorMessage());
    }
  }, [words]);

  const retry = useCallback(async (id: string) => {
    const target = words.find((word) => word.id === id);
    if (!target) return;

    // Mark as processing and clear error, then trigger enrichment.
    const processing: WordBankEntry = { ...target, status: "processing", error_reason: null };
    setWords((prev) => prev.map((word) => (word.id === id ? processing : word)));
    processingSinceRef.current.set(id, Date.now());

    try {
      const accessToken = await getAccessToken();

      const res = await fetch("/api/words", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ id, text: target.text, context: target.context }),
      });

      if (!res.ok) {
        await res.json().catch(() => null);

        throw new Error(publicDataErrorMessage());
      }
    } catch {
      setWords((prev) =>
        prev.map((word) => (word.id === id ? { ...target, error_reason: "api_error" } : word))
      );
      throw new Error(publicDataErrorMessage());
    }
  }, [words]);

  return { words, loading, error, addWord, removeWord, retry, refresh };
}
