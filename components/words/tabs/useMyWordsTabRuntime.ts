"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { useWords } from "@/hooks/useWords";
import { getUserDecksFull, type DeckListItem } from "@/lib/decks/queries";
import { publicDataErrorMessage } from "@/lib/degradation/messages";
import { toggleFavorite } from "@/lib/word-bank/queries";
import {
  loadAddToExistingDeckModal,
  loadCreateDeckFromWordsModal,
  loadQuickAddModal,
} from "./MyWordsTabModals";

interface WordStats {
  total: number;
  ready: number;
  processing: number;
}

export function useMyWordsTabRuntime(options: {
  onMyWordsCountChange?: (count: number) => void;
  onRegisterPrimaryAction?: (action: () => void) => void;
}) {
  const { onMyWordsCountChange, onRegisterPrimaryAction } = options;
  const router = useRouter();
  const { user } = useAuth();
  const { words, loading, error, addWord, removeWord, retry } = useWords();
  const [showAddWord, setShowAddWord] = useState(false);
  const [initialWordText, setInitialWordText] = useState("");
  const [wordActionError, setWordActionError] = useState<string | null>(null);
  const [selectedWordIds, setSelectedWordIds] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [showCreateFromWords, setShowCreateFromWords] = useState(false);
  const [showAddToExisting, setShowAddToExisting] = useState(false);
  const [existingDecks, setExistingDecks] = useState<DeckListItem[]>([]);

  const preloadCreateDeckFromWordsModal = useCallback(() => {
    void loadCreateDeckFromWordsModal();
  }, []);
  const preloadAddToExistingDeckModal = useCallback(() => {
    void loadAddToExistingDeckModal();
  }, []);
  const preloadQuickAddModal = useCallback(() => {
    void loadQuickAddModal();
  }, []);

  useEffect(() => {
    if (!wordActionError) return;
    const t = setTimeout(() => setWordActionError(null), 8000);
    return () => clearTimeout(t);
  }, [wordActionError]);

  useEffect(() => {
    if (!showAddToExisting || !user) {
      if (!showAddToExisting) setExistingDecks([]);
      return;
    }
    let cancelled = false;
    void getUserDecksFull(user.id).then((data) => {
      if (!cancelled) setExistingDecks(data);
    });
    return () => {
      cancelled = true;
    };
  }, [showAddToExisting, user]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;
      if (isTyping) return;
      if ((e.key === "a" || e.key === "A") && selectMode) {
        e.preventDefault();
        setSelectedWordIds(
          selectedWordIds.size === words.length
            ? new Set()
            : new Set(words.map((word) => word.id)),
        );
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectMode, selectedWordIds, words]);

  useEffect(() => {
    if (loading) return;
    onMyWordsCountChange?.(words.length);
  }, [loading, words.length, onMyWordsCountChange]);

  const wordStats = useMemo<WordStats>(
    () => ({
      total: words.length,
      ready: words.filter((word) => word.status === "ready").length,
      processing: words.filter((word) => word.status === "processing").length,
    }),
    [words],
  );

  const openAddWord = (text?: string) => {
    setInitialWordText(text ?? "");
    setShowAddWord(true);
  };

  useEffect(() => {
    onRegisterPrimaryAction?.(() => openAddWord());
  }, [onRegisterPrimaryAction]);

  return {
    router,
    words,
    loading,
    error,
    wordStats,
    showAddWord,
    initialWordText,
    wordActionError,
    selectedWordIds,
    selectMode,
    showCreateFromWords,
    showAddToExisting,
    existingDecks,
    preloadCreateDeckFromWordsModal,
    preloadAddToExistingDeckModal,
    preloadQuickAddModal,
    setShowAddWord,
    setInitialWordText,
    setWordActionError,
    setSelectedWordIds,
    setShowCreateFromWords,
    setShowAddToExisting,
    openAddWord,
    toggleWordSelection: (id: string) => {
      setSelectedWordIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    },
    handleToggleSelectMode: () => {
      setSelectMode((prev) => {
        if (prev) setSelectedWordIds(new Set());
        return !prev;
      });
    },
    handleAddWord: async (input: {
      text: string;
      context?: string | null;
      deckId?: string | null;
    }) => {
      try {
        await addWord(input);
      } catch {
        setWordActionError(publicDataErrorMessage());
      }
    },
    handleToggleFavorite: async (wordId: string, value: boolean) => {
      try {
        await toggleFavorite(wordId, value);
      } catch {
        setWordActionError(publicDataErrorMessage());
      }
    },
    handleRetry: async (id: string) => {
      try {
        await retry(id);
      } catch {
        setWordActionError("Failed to retry");
      }
    },
    handleDelete: async (id: string) => {
      try {
        await removeWord(id);
      } catch {
        setWordActionError("Failed to delete");
      }
    },
  };
}
