"use client";

import { useState, useCallback } from "react";
import { saveAIWord, getAIWords, deleteAIWord } from "@/lib/ai-db";
import type { AISavedWord, Difficulty } from "@/lib/types";

export interface SaveWordData {
  word: string;
  meaning: string;
  difficulty: Difficulty;
  context: string;
}

export function useSavedWords(conversationId: number | null) {
  const [savedWords, setSavedWords] = useState<AISavedWord[]>([]);
  const [wordToSave, setWordToSave] = useState<{ word: string; context: string } | null>(null);

  const loadSavedWords = useCallback(async () => {
    const words = await getAIWords();
    setSavedWords(words);
  }, []);

  const openSaveWordModal = useCallback((word: string, context: string) => {
    setWordToSave({ word, context });
  }, []);

  const closeSaveWordModal = useCallback(() => setWordToSave(null), []);

  const confirmSaveWord = useCallback(async (data: SaveWordData) => {
    const wordData: Omit<AISavedWord, "id"> = {
      word: data.word.toLowerCase().trim(),
      meaning: data.meaning,
      difficulty: data.difficulty,
      context: data.context,
      conversationId: conversationId ?? 0,
      savedAt: new Date().toISOString(),
    };
    const id = await saveAIWord(wordData);
    setSavedWords(prev => [{ ...wordData, id }, ...prev]);
    setWordToSave(null);
  }, [conversationId]);

  const deleteSavedWord = useCallback(async (id: number) => {
    await deleteAIWord(id);
    setSavedWords(prev => prev.filter(w => w.id !== id));
  }, []);

  return {
    savedWords,
    wordToSave,
    setWordToSave,
    loadSavedWords,
    openSaveWordModal,
    closeSaveWordModal,
    confirmSaveWord,
    deleteSavedWord,
  };
}
