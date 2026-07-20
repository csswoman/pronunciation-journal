"use client";

import { useState, useCallback, useMemo } from "react";
import { saveAIWord, getAIWords, deleteAIWord } from "@/lib/db/ai";
import type { AISavedWord, Difficulty } from "@/lib/types";

export interface SaveWordData {
  word: string;
  meaning: string;
  difficulty: Difficulty;
  context: string;
}

export function useSavedWords(userId: string | null, conversationId: number | null) {
  const [savedWords, setSavedWords] = useState<AISavedWord[]>([]);
  const [wordToSave, setWordToSave] = useState<{ word: string; context: string } | null>(null);

  const loadSavedWords = useCallback(async () => {
    if (!userId) { setSavedWords([]); return; }
    const words = await getAIWords(userId);
    setSavedWords(words);
  }, [userId]);

  const openSaveWordModal = useCallback((word: string, context: string) => {
    setWordToSave({ word, context });
  }, []);

  const closeSaveWordModal = useCallback(() => setWordToSave(null), []);

  const confirmSaveWord = useCallback(async (data: SaveWordData) => {
    if (!userId) return;
    const wordData: Omit<AISavedWord, "id" | "userId"> = {
      word: data.word.toLowerCase().trim(),
      meaning: data.meaning,
      difficulty: data.difficulty,
      context: data.context,
      conversationId: conversationId ?? 0,
      savedAt: new Date().toISOString(),
    };
    const id = await saveAIWord(userId, wordData);
    setSavedWords(prev => [{ ...wordData, userId, id }, ...prev]);
    setWordToSave(null);
  }, [conversationId, userId]);

  const deleteSavedWord = useCallback(async (id: number) => {
    if (!userId) return;
    await deleteAIWord(userId, id);
    setSavedWords(prev => prev.filter(w => w.id !== id));
  }, [userId]);

  return useMemo(
    () => ({
      savedWords,
      wordToSave,
      setWordToSave,
      loadSavedWords,
      openSaveWordModal,
      closeSaveWordModal,
      confirmSaveWord,
      deleteSavedWord,
    }),
    [
      savedWords,
      wordToSave,
      loadSavedWords,
      openSaveWordModal,
      closeSaveWordModal,
      confirmSaveWord,
      deleteSavedWord,
    ],
  );
}
