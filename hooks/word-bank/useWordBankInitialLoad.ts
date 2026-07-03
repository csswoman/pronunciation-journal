"use client";

import { useEffect } from "react";

import { publicDataErrorMessage } from "@/lib/degradation/messages";
import { getMyWords } from "@/lib/word-bank/queries";
import type { WordBankEntry } from "@/lib/word-bank/types";

interface UseWordBankInitialLoadArgs {
  enabled: boolean;
  setWords: React.Dispatch<React.SetStateAction<WordBankEntry[]>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}

export function useWordBankInitialLoad({
  enabled,
  setWords,
  setLoading,
  setError,
}: UseWordBankInitialLoadArgs) {
  useEffect(() => {
    if (!enabled) {
      setWords([]);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    getMyWords()
      .then((data) => {
        if (cancelled) return;
        setWords(data);
        setError(null);
      })
      .catch(() => {
        if (!cancelled) setError(publicDataErrorMessage());
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, setError, setLoading, setWords]);
}
