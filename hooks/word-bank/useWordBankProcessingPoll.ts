"use client";

import { useEffect } from "react";

import type { WordBankEntry } from "@/lib/word-bank/types";

const POLL_INTERVAL_MS = 2500;
const POLL_TIMEOUT_MS = 60_000;

interface UseWordBankProcessingPollArgs {
  enabled: boolean;
  words: WordBankEntry[];
  refresh: () => Promise<void>;
  processingSinceRef: React.MutableRefObject<Map<string, number>>;
  setWords: React.Dispatch<React.SetStateAction<WordBankEntry[]>>;
}

export function useWordBankProcessingPoll({
  enabled,
  words,
  refresh,
  processingSinceRef,
  setWords,
}: UseWordBankProcessingPollArgs) {
  useEffect(() => {
    const hasProcessing = words.some((word) => word.status === "processing");
    if (!hasProcessing || !enabled) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const timedOut: string[] = [];

      const stillWaiting = words.some((word) => {
        if (word.status !== "processing") return false;

        if (!processingSinceRef.current.has(word.id)) {
          processingSinceRef.current.set(word.id, now);
        }

        const since = processingSinceRef.current.get(word.id)!;
        if (now - since >= POLL_TIMEOUT_MS) {
          timedOut.push(word.id);
          return false;
        }

        return true;
      });

      if (timedOut.length > 0) {
        setWords((prev) =>
          prev.map((word) =>
            timedOut.includes(word.id)
              ? { ...word, status: "failed", error_reason: "timeout" }
              : word,
          ),
        );
        timedOut.forEach((id) => processingSinceRef.current.delete(id));
      }

      if (stillWaiting) void refresh();
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [enabled, processingSinceRef, refresh, setWords, words]);
}
