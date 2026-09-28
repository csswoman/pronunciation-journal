"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchCatalogIndex } from "@/lib/essential-words/client";
import type { CatalogIndexEntry } from "@/lib/essential-words/catalog-index";
import { buildTriageCatalogDeck } from "@/lib/essential-words/triage-deck";
import { useTriageCatalogCards } from "@/hooks/useTriageCatalogCards";
import {
  declareEssentialWordKnown,
  getEssentialWordLearnerSignal,
  getEssentialWordLearnerSignals,
  restoreEssentialWordKnownClaim,
} from "@/lib/essential-words/learner-state-queries";
import { getEssentialWordsSrsEntries } from "@/lib/db";
import { essentialWordId, type CefrLevel, type EssentialWord } from "@/lib/essential-words/types";
import type { EssentialWordLearnerSignalRecord } from "@/lib/db";
import type { SRSData } from "@/lib/types";

export interface UseKnownWordsTriageOptions {
  levels: readonly CefrLevel[];
  userId?: string;
}

interface CachedTriageData {
  catalog: CatalogIndexEntry[];
  srs: SRSData[];
  signals: EssentialWordLearnerSignalRecord[];
}

type UndoState =
  | { word: EssentialWord; action: "known"; previousSignal?: EssentialWordLearnerSignalRecord; declaredKnownAt: string }
  | { word: EssentialWord; action: "skipped" };

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function useKnownWordsTriage({ levels, userId }: UseKnownWordsTriageOptions) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deck, setDeck] = useState<CatalogIndexEntry[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [counts, setCounts] = useState({ known: 0, skipped: 0 });
  const [undoItem, setUndoItem] = useState<UndoState | null>(null);
  const [retryLoadKey, setRetryLoadKey] = useState(0);

  const cachedRef = useRef<CachedTriageData | null>(null);
  const busyRef = useRef(false);
  const levelsRef = useRef(levels);
  levelsRef.current = levels;

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);
    setActionError(null);

    Promise.all([
      fetchCatalogIndex(),
      getEssentialWordsSrsEntries(userId),
      getEssentialWordLearnerSignals(userId),
    ])
      .then(([catalog, srs, signals]) => {
        if (cancelled) return;
        const data = { catalog, srs, signals };
        cachedRef.current = data;
        setDeck(buildTriageCatalogDeck(catalog, srs, signals, levelsRef.current));
        setCurrentIndex(0);
        setCounts({ known: 0, skipped: 0 });
        setUndoItem(null);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        console.error("[useKnownWordsTriage] load error", err);
        setLoadError(errorMessage(err, "Error al cargar palabras"));
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId, retryLoadKey]);

  useEffect(() => {
    const data = cachedRef.current;
    if (!data) return;
    setDeck(buildTriageCatalogDeck(data.catalog, data.srs, data.signals, levels));
    setCurrentIndex(0);
    setCounts({ known: 0, skipped: 0 });
    setUndoItem(null);
    setActionError(null);
  }, [levels]);

  const currentEntry = deck[currentIndex];
  const nextEntry = deck[currentIndex + 1];
  const {
    current,
    nextWord,
    isLoading: isCardLoading,
    error: cardError,
    retry: retryCard,
  } = useTriageCatalogCards({ currentEntry, nextEntry });
  const remaining = Math.max(0, deck.length - currentIndex);
  const total = deck.length;
  const canUndo = undoItem !== null;

  const markKnown = useCallback(async () => {
    if (!current || busyRef.current) return;
    if (!userId) {
      setActionError("No se pudo guardar la familiaridad. Inicia sesión e inténtalo de nuevo.");
      return;
    }

    busyRef.current = true;
    setIsSaving(true);
    setActionError(null);
    const wordId = essentialWordId(current.word);
    const declaredKnownAt = new Date().toISOString();

    try {
      const previousSignal = await getEssentialWordLearnerSignal(userId, wordId);
      const savedSignal = await declareEssentialWordKnown(userId, wordId, declaredKnownAt);
      if (cachedRef.current) {
        cachedRef.current.signals = [
          ...cachedRef.current.signals.filter((signal) => signal.wordId !== wordId),
          savedSignal,
        ];
      }
      setUndoItem({
        word: current,
        action: "known",
        previousSignal,
        declaredKnownAt: savedSignal.declaredKnownAt ?? declaredKnownAt,
      });
      setCounts((previous) => ({ ...previous, known: previous.known + 1 }));
      setCurrentIndex((previous) => previous + 1);
    } catch (err) {
      console.error("[useKnownWordsTriage] save claim error", err);
      setActionError(errorMessage(err, "No se pudo guardar la familiaridad. Inténtalo de nuevo."));
    } finally {
      busyRef.current = false;
      setIsSaving(false);
    }
  }, [current, userId]);

  const skip = useCallback(() => {
    if (!current || busyRef.current) return;
    setActionError(null);
    setUndoItem({ word: current, action: "skipped" });
    setCounts((previous) => ({ ...previous, skipped: previous.skipped + 1 }));
    setCurrentIndex((previous) => previous + 1);
  }, [current]);

  const undoLast = useCallback(async () => {
    if (!undoItem || busyRef.current) return;
    busyRef.current = true;
    setIsSaving(true);
    setActionError(null);

    try {
      if (undoItem.action === "known") {
        if (!userId) throw new Error("Inicia sesión para deshacer esta declaración.");
        const wordId = essentialWordId(undoItem.word.word);
        await restoreEssentialWordKnownClaim(
          userId,
          wordId,
          undoItem.previousSignal,
          undoItem.declaredKnownAt,
        );
        if (cachedRef.current) {
          cachedRef.current.signals = [
            ...cachedRef.current.signals.filter((signal) => signal.wordId !== wordId),
            ...(undoItem.previousSignal ? [undoItem.previousSignal] : []),
          ];
        }
        setCounts((previous) => ({ ...previous, known: Math.max(0, previous.known - 1) }));
      } else {
        setCounts((previous) => ({ ...previous, skipped: Math.max(0, previous.skipped - 1) }));
      }
      setUndoItem(null);
      setCurrentIndex((previous) => Math.max(0, previous - 1));
    } catch (err) {
      console.error("[useKnownWordsTriage] undo error", err);
      setActionError(errorMessage(err, "No se pudo deshacer. Inténtalo de nuevo."));
    } finally {
      busyRef.current = false;
      setIsSaving(false);
    }
  }, [undoItem, userId]);

  const retryLoad = useCallback(() => setRetryLoadKey((previous) => previous + 1), []);

  return {
    isLoading,
    isSaving,
    isCardLoading,
    loadError,
    error: actionError,
    cardError,
    deck,
    current,
    nextWord,
    currentIndex,
    total,
    remaining,
    counts,
    canUndo,
    markKnown,
    skip,
    undoLast,
    retryLoad,
    retryCard,
  };
}
