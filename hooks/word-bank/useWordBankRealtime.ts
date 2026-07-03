"use client";

import { useEffect } from "react";

import { applyWordBankChange } from "@/lib/word-bank/apply-word-bank-change";
import { subscribeWordBankChanges } from "@/lib/word-bank/realtime";
import type { WordBankEntry } from "@/lib/word-bank/types";

interface UseWordBankRealtimeArgs {
  userId?: string;
  pendingAddRef: React.MutableRefObject<Map<string, string>>;
  processingSinceRef: React.MutableRefObject<Map<string, number>>;
  setWords: React.Dispatch<React.SetStateAction<WordBankEntry[]>>;
}

export function useWordBankRealtime({
  userId,
  pendingAddRef,
  processingSinceRef,
  setWords,
}: UseWordBankRealtimeArgs) {
  useEffect(() => {
    if (!userId) return;

    const subscription = subscribeWordBankChanges(userId, {
      onChange: (event) => {
        setWords((prev) =>
          applyWordBankChange(
            prev,
            event,
            pendingAddRef.current,
            processingSinceRef.current,
          ),
        );
      },
    });

    return () => {
      void subscription.unsubscribe();
    };
  }, [pendingAddRef, processingSinceRef, setWords, userId]);
}
