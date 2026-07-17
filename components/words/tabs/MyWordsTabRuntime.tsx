"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus } from "@/components/icons";

import Section from "@/components/layout/Section";
import Button from "@/components/ui/Button";
import { WordsHero } from "@/components/words/WordsHero";
import { WordsTab } from "@/components/vocabulary/words/WordsTab";
import { WordSelectionBar } from "@/components/vocabulary/words/WordSelectionBar";
import { useAuth } from "@/components/auth/AuthProvider";
import { useWords } from "@/hooks/useWords";
import { getUserDecksFull, type DeckListItem } from "@/lib/decks/queries";
import { publicDataErrorMessage } from "@/lib/degradation/messages";
import { toggleFavorite } from "@/lib/word-bank/queries";
import type { WordsTabId } from "@/components/words/WordsTopbar";

const loadQuickAddModal = () => import("@/components/vocabulary/words/QuickAddModal");
const loadCreateDeckFromWordsModal = () => import("@/components/vocabulary/decks/CreateDeckFromWordsModal");
const loadAddToExistingDeckModal = () => import("@/components/vocabulary/decks/AddToExistingDeckModal");

const QuickAddModal = dynamic(() => loadQuickAddModal().then((mod) => mod.QuickAddModal));
const CreateDeckFromWordsModal = dynamic(() => loadCreateDeckFromWordsModal().then((mod) => mod.CreateDeckFromWordsModal));
const AddToExistingDeckModal = dynamic(() => loadAddToExistingDeckModal().then((mod) => mod.AddToExistingDeckModal));

interface WordStats {
  total: number;
  ready: number;
  processing: number;
}

interface MyWordsTabRuntimeProps {
  deckCount: number;
  onMyWordsCountChange: (count: number) => void;
  onDeckCountChange: (count: number) => void;
  onTabChange: (tab: WordsTabId) => void;
}

export default function MyWordsTabRuntime({
  deckCount,
  onMyWordsCountChange,
  onDeckCountChange,
  onTabChange,
}: MyWordsTabRuntimeProps) {
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
      if (showAddWord) return;
      const target = e.target as HTMLElement | null;
      const isTyping = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;
      if (isTyping) return;
      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        setShowAddWord(true);
      }
      if (e.key === "a" || e.key === "A") {
        if (!selectMode) return;
        e.preventDefault();
        if (selectedWordIds.size === words.length) {
          setSelectedWordIds(new Set());
        } else {
          setSelectedWordIds(new Set(words.map((word) => word.id)));
        }
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showAddWord, selectMode, selectedWordIds, words]);

  useEffect(() => {
    if (loading) return;
    onMyWordsCountChange(words.length);
  }, [loading, words.length, onMyWordsCountChange]);

  useEffect(() => {
    if (loading) return;
    onDeckCountChange(deckCount);
  }, [loading, deckCount, onDeckCountChange]);

  const wordStats = useMemo<WordStats>(() => ({
    total: words.length,
    ready: words.filter((word) => word.status === "ready").length,
    processing: words.filter((word) => word.status === "processing").length,
  }), [words]);

  const toggleWordSelection = (id: string) => {
    setSelectedWordIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleSelectMode = () => {
    setSelectMode((prev) => {
      if (prev) setSelectedWordIds(new Set());
      return !prev;
    });
  };

  const handleAddWord = async (input: { text: string; context?: string | null; deckId?: string | null }) => {
    try {
      await addWord(input);
    } catch {
      setWordActionError(publicDataErrorMessage());
    }
  };

  const handleToggleFavorite = async (wordId: string, value: boolean) => {
    try {
      await toggleFavorite(wordId, value);
    } catch {
      setWordActionError(publicDataErrorMessage());
    }
  };

  const openAddWord = (text?: string) => {
    setInitialWordText(text ?? "");
    setShowAddWord(true);
  };

  return (
    <>
      <WordsHero
        activeTab="my-words"
        myWordsCount={words.length}
        deckCount={deckCount}
        lexiconLearned={0}
        lexiconTotal={0}
        wordsLoading={loading}
        onAddWord={() => openAddWord()}
        onAddDeck={() => {}}
      />

      <Section spacing="md">
        <WordsTab
          words={words}
          loading={loading}
          error={error}
          actionError={wordActionError}
          wordStats={wordStats}
          selectedWordIds={selectedWordIds}
          selectMode={selectMode}
          onToggleSelectMode={handleToggleSelectMode}
          onToggleWordSelection={toggleWordSelection}
          onRetry={async (id) => {
            try {
              await retry(id);
            } catch {
              setWordActionError("Failed to retry");
            }
          }}
          onDelete={async (id) => {
            try {
              await removeWord(id);
            } catch {
              setWordActionError("Failed to delete");
            }
          }}
          onOpenAddWord={(text) => openAddWord(text)}
          onToggleFavorite={handleToggleFavorite}
          onClearActionError={() => setWordActionError(null)}
        />
      </Section>

      <Button
        onClick={() => setShowAddWord(true)}
        aria-label="Quick add word"
        onMouseEnter={preloadQuickAddModal}
        onFocus={preloadQuickAddModal}
        className="fixed bottom-6 right-6 z-40 lg:hidden !rounded-full !p-4 shadow-xl"
        size="icon"
      >
        <Plus size={20} />
      </Button>

      {selectMode && selectedWordIds.size > 0 && (
        <WordSelectionBar
          count={selectedWordIds.size}
          onClear={() => setSelectedWordIds(new Set())}
          onCreateDeck={() => setShowCreateFromWords(true)}
          onAddToExistingDeck={() => setShowAddToExisting(true)}
          onCreateDeckHover={preloadCreateDeckFromWordsModal}
          onAddToExistingDeckHover={preloadAddToExistingDeckModal}
        />
      )}

      <QuickAddModal
        open={showAddWord}
        onClose={() => {
          setShowAddWord(false);
          setInitialWordText("");
        }}
        onSubmit={handleAddWord}
        initialText={initialWordText}
      />

      {showCreateFromWords && (
        <CreateDeckFromWordsModal
          wordIds={Array.from(selectedWordIds)}
          onClose={() => setShowCreateFromWords(false)}
          onCreated={() => {
            onDeckCountChange(deckCount + 1);
            setShowCreateFromWords(false);
            setSelectedWordIds(new Set());
            onTabChange("decks");
          }}
        />
      )}

      {showAddToExisting && (
        <AddToExistingDeckModal
          wordIds={Array.from(selectedWordIds)}
          decks={existingDecks}
          onClose={() => setShowAddToExisting(false)}
          onAdded={() => {
            setShowAddToExisting(false);
            setSelectedWordIds(new Set());
          }}
        />
      )}
    </>
  );
}
