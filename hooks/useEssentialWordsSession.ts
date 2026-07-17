"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  reinsertLearning,
  deriveCounts,
  appendNewBatch,
  type Core1000QueueItem,
} from "@/lib/core-1000/queue";
import { gradeCore1000Word, type GradeExtras } from "@/lib/core-1000/grade";
import { core1000WordId, NEW_CARDS_PER_DAY, type CoreWord } from "@/lib/core-1000/types";
import { loadPendingLapses, savePendingLapses } from "@/lib/core-1000/pending-lapses";
import {
  loadEssentialWordsQueue,
  type EssentialWordsStats,
} from "@/lib/core-1000/session-loader";
import {
  advanceSummary,
  buildCore1000ExerciseResult,
  phaseForCore1000Item,
  type EssentialWordsPhase,
  type EssentialWordsSessionSummary,
} from "@/lib/core-1000/session-model";
import {
  recordCore1000Introduction,
  snoozeEssentialWord,
} from "@/lib/db";
import { useAuth } from "@/components/auth/AuthProvider";
import { recordActivitySession } from "@/lib/progress/activity-hub";
import { buildSessionResult } from "@/lib/practice/session-result";
import type { ExerciseResult } from "@/lib/practice/types";

export type { EssentialWordsPhase, EssentialWordsSessionSummary } from "@/lib/core-1000/session-model";
export type { EssentialWordsStats } from "@/lib/core-1000/session-loader";

export interface EssentialWordsCounts {
  newRemaining: number;
  learningRemaining: number;
  reviewRemaining: number;
}

const EMPTY_STATS: EssentialWordsStats = {
  totalWords: 0, learned: 0, dueCount: 0, newToday: 0, newQuota: NEW_CARDS_PER_DAY,
};
const EMPTY_COUNTS: EssentialWordsCounts = {
  newRemaining: 0, learningRemaining: 0, reviewRemaining: 0,
};

export function useEssentialWordsSession() {
  const { user } = useAuth();
  const [phase, setPhase] = useState<EssentialWordsPhase>("loading");
  const [queue, setQueue] = useState<Core1000QueueItem[]>([]);
  const [index, setIndex] = useState(0);
  const [stats, setStats] = useState<EssentialWordsStats>(EMPTY_STATS);
  const [counts, setCounts] = useState<EssentialWordsCounts>(EMPTY_COUNTS);
  const [sessionSummary, setSessionSummary] = useState<EssentialWordsSessionSummary | null>(null);
  const [reloadLoading, setReloadLoading] = useState(false);

  const sessionResultsRef = useRef<ExerciseResult[]>([]);
  const finishingRef = useRef(false);
  // Pending lapses: wordId → quality — flushed to Dexie on session end
  const pendingLapsesRef = useRef<Map<string, number>>(new Map());
  const lapseFlushRef = useRef<Promise<void> | null>(null);
  const allWordsRef = useRef<CoreWord[]>([]);
  const seenIdsRef = useRef<Set<string>>(new Set());

  const persistPendingLapses = useCallback(() => {
    savePendingLapses(pendingLapsesRef.current);
  }, []);

  const syncCounts = useCallback((q: Core1000QueueItem[], i: number) => {
    setCounts(deriveCounts(q, i));
  }, []);

  const flushLapses = useCallback(async () => {
    if (lapseFlushRef.current) return lapseFlushRef.current;

    const flush = (async () => {
      const pending = Array.from(pendingLapsesRef.current.entries());
      for (const [wordId, quality] of pending) {
        const word = wordId.replace("c1k:", "");
        try {
          await gradeCore1000Word(word, quality, {}, user?.id);
          if (pendingLapsesRef.current.get(wordId) === quality) {
            pendingLapsesRef.current.delete(wordId);
            persistPendingLapses();
          }
        } catch (err) {
          console.error("[EssentialWordsSession] failed to persist lapse", { wordId, err });
        }
      }
    })();

    lapseFlushRef.current = flush.finally(() => {
      lapseFlushRef.current = null;
    });
    return lapseFlushRef.current;
  }, [persistPendingLapses, user?.id]);

  useEffect(() => {
    pendingLapsesRef.current = loadPendingLapses();
  }, []);

  useEffect(() => {
    if (pendingLapsesRef.current.size === 0) return;
    void flushLapses();
  }, [flushLapses]);

  useEffect(() => {
    const handlePageHide = () => {
      void flushLapses();
    };
    window.addEventListener("pagehide", handlePageHide);
    return () => {
      window.removeEventListener("pagehide", handlePageHide);
      void flushLapses();
    };
  }, [flushLapses]);

  const finishSession = useCallback(async () => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    setPhase("done");
    await flushLapses();
    if (!user?.id) {
      finishingRef.current = false;
      return;
    }
    const sessionResult = buildSessionResult(sessionResultsRef.current);
    try {
      await recordActivitySession(user.id, { practiceContext: "core-1000", sessionResult });
      const { flushOutbox } = await import("@/lib/sync/sync-manager");
      await flushOutbox();
    } catch (err) {
      console.error("[EssentialWordsSession] recordActivitySession failed", err);
    } finally {
      finishingRef.current = false;
    }
  }, [user?.id, flushLapses]);

  const advance = useCallback((q: Core1000QueueItem[], i: number) => {
    const next = i + 1;
    if (next >= q.length) {
      void finishSession();
      return;
    }
    setIndex(next);
    syncCounts(q, next);
    setPhase(phaseForCore1000Item(q[next]));
  }, [finishSession, syncCounts]);

  const bootstrap = useCallback(async () => {
    const { items, stats: nextStats, allWords, seenIds, initialPhase } = await loadEssentialWordsQueue();
    finishingRef.current = false;
    allWordsRef.current = allWords;
    seenIdsRef.current = seenIds;
    setQueue(items);
    setStats(nextStats);
    setIndex(0);
    setSessionSummary(null);
    sessionResultsRef.current = [];
    pendingLapsesRef.current = new Map();
    persistPendingLapses();
    syncCounts(items, 0);
    setPhase(initialPhase);
  }, [persistPendingLapses, syncCounts]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { items, stats: nextStats, allWords, seenIds, initialPhase } = await loadEssentialWordsQueue();
        if (cancelled) return;
        allWordsRef.current = allWords;
        seenIdsRef.current = seenIds;
        setQueue(items);
        setStats(nextStats);
        syncCounts(items, 0);
        setPhase(initialPhase);
      } catch (err) {
        console.error("[EssentialWordsSession] initial load failed", err);
        if (!cancelled) setPhase("error");
      }
    })();
    return () => { cancelled = true; };
  }, [syncCounts]);

  const startSpeak = useCallback(() => setPhase("speak"), []);

  const submitGrade = useCallback(
    async (quality: number, extras?: GradeExtras) => {
      const item = queue[index];
      if (!item) return;
      const wordId = core1000WordId(item.entry.word.toLowerCase());

      const result = buildCore1000ExerciseResult(item, quality, extras);

      if (quality >= 3) {
        await gradeCore1000Word(item.entry.word, quality, extras, user?.id);
        seenIdsRef.current.add(wordId);
        pendingLapsesRef.current.delete(wordId);
        persistPendingLapses();
        if (item.kind === "new") {
          await recordCore1000Introduction(item.entry.word.toLowerCase());
          setStats((s) => ({ ...s, newToday: s.newToday + 1, learned: s.learned + 1 }));
        }
        sessionResultsRef.current.push(result);
        setSessionSummary((prev) => advanceSummary(prev, true));
        advance(queue, index);
      } else {
        // Fail: re-insert ~3 positions ahead, defer SM-2 write to session end
        seenIdsRef.current.add(wordId);
        pendingLapsesRef.current.set(wordId, quality);
        persistPendingLapses();
        const newQueue = reinsertLearning(queue, index, item);
        setQueue(newQueue);
        sessionResultsRef.current.push(result);
        setSessionSummary((prev) => advanceSummary(prev, false));
        advance(newQueue, index);
      }
    },
    [queue, index, advance, persistPendingLapses, user?.id],
  );

  const learnMore = useCallback(() => {
    const newQueue = appendNewBatch(
      queue, allWordsRef.current, seenIdsRef.current, NEW_CARDS_PER_DAY,
    );
    setQueue(newQueue);
    const nextIndex = phase === "done" ? queue.length : Math.min(index, queue.length);
    if (newQueue.length <= nextIndex) {
      return;
    }
    setIndex(nextIndex);
    syncCounts(newQueue, nextIndex);
    setPhase(phaseForCore1000Item(newQueue[nextIndex]));
  }, [phase, queue, index, syncCounts]);

  const archiveWord = useCallback(async (word: string) => {
    await snoozeEssentialWord(word);
    seenIdsRef.current.add(core1000WordId(word.toLowerCase()));
    const newQueue = queue.filter((_, i) => i !== index);
    setQueue(newQueue);
    if (newQueue.length === 0 || index >= newQueue.length) {
      void finishSession();
      return;
    }
    syncCounts(newQueue, index);
    setPhase(phaseForCore1000Item(newQueue[index]));
  }, [queue, index, finishSession, syncCounts]);

  const reload = useCallback(async () => {
    setReloadLoading(true);
    try { await bootstrap(); }
    finally { setReloadLoading(false); }
  }, [bootstrap]);

  return {
    phase,
    current: queue[index] ?? null,
    stats,
    counts,
    sessionSummary,
    reloadLoading,
    startSpeak,
    submitGrade,
    reload,
    learnMore,
    archiveWord,
  };
}
