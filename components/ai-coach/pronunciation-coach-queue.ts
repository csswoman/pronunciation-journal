import {
  BATCH_SIZE,
  pickBatch,
  saveQueueToDexie,
  shuffle,
} from "@/lib/ai-coach/pronunciation";
import type { WordIPA } from "@/components/ai-coach/pronunciation/types";
import type { ScoringResult } from "@/lib/types";
import type { Dispatch, SetStateAction } from "react";

type QueueSetters = {
  setQueue: Dispatch<SetStateAction<string[]>>;
  setBatchCount: Dispatch<SetStateAction<number>>;
  setWordIPAs: Dispatch<SetStateAction<WordIPA[]>>;
  setLatestScoring: Dispatch<SetStateAction<ScoringResult | null>>;
  setFetchingPhrases: Dispatch<SetStateAction<boolean>>;
  reset: () => void;
  userId: string | undefined;
};

export function loadMoreFromPool(
  currentSeen: Set<string>,
  currentMastered: Set<string>,
  { setQueue, setBatchCount, setWordIPAs, setLatestScoring, reset, userId }: QueueSetters,
): void {
  const exclude = new Set([...currentSeen, ...currentMastered]);
  const batch = pickBatch(exclude);
  const fallback = batch.length === 0 ? pickBatch(currentMastered) : batch;
  setQueue(fallback);
  if (userId) void saveQueueToDexie(userId, fallback);
  setBatchCount(fallback.length);
  reset();
  setWordIPAs([]);
  setLatestScoring(null);
}

export async function fetchMoreWithAI(
  currentSeen: Set<string>,
  mastered: Set<string>,
  setters: QueueSetters,
): Promise<void> {
  const {
    setQueue,
    setBatchCount,
    setWordIPAs,
    setFetchingPhrases,
    reset,
    userId,
  } = setters;

  setFetchingPhrases(true);
  try {
    const res = await fetch("/api/gemini/phrases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ exclude: [...currentSeen].slice(-30), count: BATCH_SIZE }),
    });
    if (!res.ok) {
      loadMoreFromPool(currentSeen, mastered, setters);
      return;
    }

    const { phrases } = (await res.json()) as { phrases?: string[] };
    if (!Array.isArray(phrases) || phrases.length === 0) {
      loadMoreFromPool(currentSeen, mastered, setters);
      return;
    }

    const batch = shuffle(phrases).slice(0, BATCH_SIZE);
    setQueue(batch);
    if (userId) void saveQueueToDexie(userId, batch);
    setBatchCount(batch.length);
    reset();
    setWordIPAs([]);
  } catch {
    loadMoreFromPool(currentSeen, mastered, setters);
  } finally {
    setFetchingPhrases(false);
  }
}
