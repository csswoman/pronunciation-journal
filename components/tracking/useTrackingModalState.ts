"use client";

import { useCallback, useEffect, useState } from "react";
import type { useTracking } from "@/hooks/useTracking";
import {
  removeTrackedItem,
  saveTrackedItem,
  updateTrackedItem as updateTrackedItemQuery,
} from "@/lib/tracking/queries";
import type { TrackingReviewSource } from "@/lib/tracking/review-queue";
import type { TrackedItem } from "@/lib/tracking/types";
import type { WordBankEntry } from "@/lib/word-bank/types";

type TrackingHookValue = ReturnType<typeof useTracking>;

interface UseTrackingModalStateOptions {
  words: TrackingHookValue["words"];
  userId: TrackingHookValue["userId"];
  addWord: TrackingHookValue["addWord"];
  removeWord: TrackingHookValue["removeWord"];
  updateWord: TrackingHookValue["updateWord"];
}

export function useTrackingModalState({
  words,
  userId,
  addWord,
  removeWord,
  updateWord,
}: UseTrackingModalStateOptions) {
  const [phrase, setPhrase] = useState("");
  const [phraseContext, setPhraseContext] = useState("");
  const [showWordModal, setShowWordModal] = useState(false);
  const [showPhraseModal, setShowPhraseModal] = useState(false);
  const [editingWord, setEditingWord] = useState<WordBankEntry | null>(null);
  const [editingTrackedItem, setEditingTrackedItem] = useState<TrackedItem | null>(null);
  const [deletingWord, setDeletingWord] = useState<WordBankEntry | null>(null);
  const [deletingExplanation, setDeletingExplanation] = useState<TrackingReviewSource | null>(null);

  const editExistingWord = useCallback((wordId: string) => {
    const existing = words.find((word) => word.id === wordId);
    if (!existing) return;
    setShowWordModal(false);
    setEditingWord(existing);
  }, [words]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (showWordModal || showPhraseModal || event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable) return;
      if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        setShowWordModal(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showPhraseModal, showWordModal]);

  const addPhrase = useCallback(async () => {
    const text = phrase.trim();
    if (!userId || !text) return;
    const context = phraseContext.trim();
    await saveTrackedItem({
      userId,
      kind: "phrase",
      ref: text.toLowerCase(),
      title: text,
      payload: { text, ...(context ? { context } : {}) },
    });
    setPhrase("");
    setPhraseContext("");
    setShowPhraseModal(false);
  }, [phrase, phraseContext, userId]);

  const deleteExplanation = useCallback(async (source: TrackingReviewSource) => {
    if (!userId || !("trackedItem" in source)) return;
    await removeTrackedItem(userId, source.trackedItem.kind, source.trackedItem.ref);
    setDeletingExplanation(null);
  }, [userId]);

  const updateTrackedItem = useCallback(async (
    id: string,
    updates: { title?: string | null; payload?: Record<string, unknown> },
  ) => {
    if (!userId) return;
    await updateTrackedItemQuery({ id, userId, title: updates.title, payload: updates.payload });
  }, [userId]);

  return {
    state: {
      showWordModal,
      showPhraseModal,
      phrase,
      phraseContext,
      editingWord,
      editingTrackedItem,
      deletingWord,
      deletingExplanation,
    },
    actions: {
      onAddWord: addWord,
      onRemoveWord: removeWord,
      onUpdateWord: updateWord,
      onEditExistingWord: editExistingWord,
      onOpenWordModal: () => setShowWordModal(true),
      onOpenPhraseModal: () => setShowPhraseModal(true),
      onCloseWordModal: () => setShowWordModal(false),
      onClosePhraseModal: () => setShowPhraseModal(false),
      onChangePhrase: setPhrase,
      onChangePhraseContext: setPhraseContext,
      onAddPhrase: addPhrase,
      onUpdateTrackedItem: updateTrackedItem,
      onCloseEditWord: () => setEditingWord(null),
      onCloseEditPhrase: () => setEditingTrackedItem(null),
      onCloseDeleteWord: () => setDeletingWord(null),
      onCloseDeleteExplanation: () => setDeletingExplanation(null),
      onDeleteExplanation: deleteExplanation,
      onEditWord: setEditingWord,
      onDeleteWord: setDeletingWord,
      onDeleteExplanationRequest: setDeletingExplanation,
      onEditPhrase: (source: TrackingReviewSource) => {
        if ("trackedItem" in source) setEditingTrackedItem(source.trackedItem);
      },
    },
  };
}
