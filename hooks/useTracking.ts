"use client";

import { useEffect, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useAuth } from "@/components/auth/AuthProvider";
import { hydrateTrackedItems, listTrackedItems } from "@/lib/tracking/queries";
import type { TrackingItem } from "@/lib/tracking/types";
import type { TrackingReviewSource } from "@/lib/tracking/review-queue";
import { deriveWordProgressSignal, WORD_PROGRESS_LABELS } from "@/lib/word-bank/progress-state";
import { useWords } from "./useWords";

export function useTracking() {
  const { user } = useAuth();
  const { words, loading: wordsLoading, addWord, removeWord, updateWord } = useWords();
  const trackedItems = useLiveQuery(
    () => user ? listTrackedItems(user.id) : Promise.resolve([]),
    [user?.id],
    [],
  );

  useEffect(() => {
    if (!user || !navigator.onLine) return;
    void hydrateTrackedItems(user.id).catch(() => undefined);
  }, [user?.id]);

  const reviewSources = useMemo<TrackingReviewSource[]>(() => {
    const favoriteWords = words
      .filter((word) => (word as typeof word & { is_favorite?: boolean }).is_favorite)
      .map((word) => {
        const progressState = deriveWordProgressSignal(word)
        const item: TrackingItem = {
          id: word.id,
          kind: "word",
          title: word.text,
          description: word.translation ?? word.meaning,
          progressState,
          progressLabel: WORD_PROGRESS_LABELS[progressState],
        }
        return { item, word }
      });
    const saved = trackedItems.map((trackedItem) => {
      const item: TrackingItem = {
        id: trackedItem.id,
        kind: trackedItem.kind,
        title: trackedItem.title ?? trackedItem.ref,
        description: typeof trackedItem.payload.context === "string" ? trackedItem.payload.context : null,
        href: trackedItem.kind === "lesson" ? `/mini-lessons/${trackedItem.ref}` : undefined,
        progressState: 'saved',
        progressLabel: WORD_PROGRESS_LABELS.saved,
      }
      return { item, trackedItem }
    });
    return [...favoriteWords, ...saved];
  }, [trackedItems, words]);

  const items = useMemo(() => reviewSources.map((source) => source.item), [reviewSources]);

  return { items, reviewSources, words, loading: wordsLoading, userId: user?.id ?? null, addWord, removeWord, updateWord };
}
