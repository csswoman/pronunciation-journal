"use client";

import { useEffect, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useAuth } from "@/components/auth/AuthProvider";
import { hydrateTrackedItems, listTrackedItems } from "@/lib/tracking/queries";
import type { TrackingItem } from "@/lib/tracking/types";
import { useWords } from "./useWords";

export function useTracking() {
  const { user } = useAuth();
  const { words, loading: wordsLoading, addWord } = useWords();
  const trackedItems = useLiveQuery(
    () => user ? listTrackedItems(user.id) : Promise.resolve([]),
    [user?.id],
    [],
  );

  useEffect(() => {
    if (!user || !navigator.onLine) return;
    void hydrateTrackedItems(user.id).catch(() => undefined);
  }, [user?.id]);

  const items = useMemo<TrackingItem[]>(() => {
    const favoriteWords = words
      .filter((word) => (word as typeof word & { is_favorite?: boolean }).is_favorite)
      .map((word) => ({ id: word.id, kind: "word" as const, title: word.text, description: word.translation ?? word.meaning }));
    const saved = trackedItems.map((item) => ({
      id: item.id,
      kind: item.kind,
      title: item.title ?? item.ref,
      description: typeof item.payload.text === "string" ? item.payload.text : null,
      href: item.kind === "lesson" ? `/mini-lessons/${item.ref}` : undefined,
    }));
    return [...favoriteWords, ...saved];
  }, [trackedItems, words]);

  return { items, loading: wordsLoading, userId: user?.id ?? null, addWord };
}
