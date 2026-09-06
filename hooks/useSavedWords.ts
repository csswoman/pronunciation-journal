"use client";

import { useState, useCallback, useMemo } from "react";
import { persistSaveable } from "@/lib/ai-coach/saveables/persist";
import type { TurnSaveable } from "@/lib/ai-practice/tools/registry";
import type { Difficulty } from "@/lib/types";

export interface SaveWordData {
  word: string;
  meaning: string;
  difficulty: Difficulty;
  context: string;
}

/**
 * Modal state for the manual "select text to save" path, plus the single
 * write entry point both paths share.
 *
 * The saved list itself is no longer held here — coach-saved items live in
 * word_bank / tracked_items and are read from /tracking.
 */
export function useSavedWords(userId: string | null) {
  const [wordToSave, setWordToSave] = useState<{ word: string; context: string } | null>(null);

  const openSaveWordModal = useCallback((word: string, context: string) => {
    setWordToSave({ word, context });
  }, []);

  const closeSaveWordModal = useCallback(() => setWordToSave(null), []);

  const saveSaveable = useCallback(
    async (saveable: TurnSaveable) => {
      if (!userId) throw new Error("Not authenticated");
      await persistSaveable(userId, saveable);
    },
    [userId],
  );

  const confirmSaveWord = useCallback(
    async (data: SaveWordData) => {
      if (!userId) return;
      await persistSaveable(userId, {
        type: "word",
        text: data.word.trim(),
        meaning: data.meaning,
        ...(data.context ? { example: data.context } : {}),
      });
      setWordToSave(null);
    },
    [userId],
  );

  return useMemo(
    () => ({
      wordToSave,
      setWordToSave,
      openSaveWordModal,
      closeSaveWordModal,
      confirmSaveWord,
      saveSaveable,
    }),
    [wordToSave, openSaveWordModal, closeSaveWordModal, confirmSaveWord, saveSaveable],
  );
}
