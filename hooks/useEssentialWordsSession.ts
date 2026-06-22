"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { fetchCoreWords } from "@/lib/core-1000/client";
import {
  buildSessionQueue,
  reinsertLearning,
  deriveCounts,
  appendNewBatch,
  type Core1000QueueItem,
} from "@/lib/core-1000/queue";
import { gradeCore1000Word, type GradeExtras } from "@/lib/core-1000/grade";
import { core1000WordId, NEW_CARDS_PER_DAY, type CoreWord } from "@/lib/core-1000/types";
import {
  getCore1000SrsEntries,
  getCore1000IntroducedToday,
  recordCore1000Introduction,
  archiveCore1000Word,
} from "@/lib/db";
import { useAuth } from "@/components/auth/AuthProvider";
import { recordActivitySession } from "@/lib/progress/activity-hub";
import { buildSessionResult } from "@/lib/practice/session-result";
import type { ExerciseResult } from "@/lib/practice/types";

export type EssentialWordsPhase = "loading" | "study" | "speak" | "done" | "empty" | "error";

export interface EssentialWordsStats {
  totalWords: number;
  learned: number;
  dueCount: number;
  newToday: number;
  newQuota: number;
}

export interface EssentialWordsCounts {
  newRemaining: number;
  learningRemaining: number;
  reviewRemaining: number;
}

export interface EssentialWordsSessionSummary {
  practiced: number;
  correct: number;
}

interface UseEssentialWordsSessionReturn {
  phase: EssentialWordsPhase;
  current: Core1000QueueItem | null;
  stats: EssentialWordsStats;
  counts: EssentialWordsCounts;
  sessionSummary: EssentialWordsSessionSummary | null;
  reloadLoading: boolean;
  startSpeak: () => void;
  submitGrade: (quality: number, extras?: GradeExtras) => Promise<void>;
  reload: () => Promise<void>;
  learnMore: () => void;
  archiveWord: (word: string) => Promise<void>;
}

const EMPTY_STATS: EssentialWordsStats = {
  totalWords: 0, learned: 0, dueCount: 0, newToday: 0, newQuota: NEW_CARDS_PER_DAY,
};
const EMPTY_COUNTS: EssentialWordsCounts = {
  newRemaining: 0, learningRemaining: 0, reviewRemaining: 0,
};

function phaseForItem(item: Core1000QueueItem): EssentialWordsPhase {
  return item.kind === "new" ? "study" : "speak";
}

async function loadQueue(): Promise<{
  items: Core1000QueueItem[];
  stats: EssentialWordsStats;
  allWords: CoreWord[];
  seenIds: Set<string>;
  initialPhase: EssentialWordsPhase;
}> {
  const [words, srsEntries, introducedToday] = await Promise.all([
    fetchCoreWords(),
    getCore1000SrsEntries(),
    getCore1000IntroducedToday(),
  ]);

  const items = buildSessionQueue({ words, srsEntries, introducedToday, now: new Date() });
  const seenIds = new Set(srsEntries.map((e) => e.wordId));

  const stats: EssentialWordsStats = {
    totalWords: words.length,
    learned: srsEntries.length,
    dueCount: items.filter((i) => i.kind === "review").length,
    newToday: introducedToday.length,
    newQuota: NEW_CARDS_PER_DAY,
  };

  return {
    items,
    stats,
    allWords: words,
    seenIds,
    initialPhase: items.length === 0 ? "empty" : phaseForItem(items[0]),
  };
}

export function useEssentialWordsSession(): UseEssentialWordsSessionReturn {
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
    if (typeof window === "undefined") return;
    const entries = Array.from(pendingLapsesRef.current.entries());
    if (entries.length === 0) {
      window.sessionStorage.removeItem("core1000:pending-lapses");
      return;
    }
    window.sessionStorage.setItem("core1000:pending-lapses", JSON.stringify(entries));
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
    if (typeof window === "undefined") return;
    const raw = window.sessionStorage.getItem("core1000:pending-lapses");
    if (!raw) return;

    try {
      const entries = JSON.parse(raw) as [string, number][];
      pendingLapsesRef.current = new Map(entries);
    } catch {
      window.sessionStorage.removeItem("core1000:pending-lapses");
    }
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
    void recordActivitySession(user.id, { practiceContext: "core-1000", sessionResult })
      .then(() => import("@/lib/sync/sync-manager").then(({ flushOutbox }) => flushOutbox()))
      .catch((err) => {
        console.error("[EssentialWordsSession] recordActivitySession failed", err);
      })
      .finally(() => {
        finishingRef.current = false;
      });
  }, [user?.id, flushLapses]);

  const advance = useCallback((q: Core1000QueueItem[], i: number) => {
    const next = i + 1;
    if (next >= q.length) {
      void finishSession();
      return;
    }
    setIndex(next);
    syncCounts(q, next);
    setPhase(phaseForItem(q[next]));
  }, [finishSession, syncCounts]);

  const bootstrap = useCallback(async () => {
    const { items, stats: nextStats, allWords, seenIds, initialPhase } = await loadQueue();
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
        const { items, stats: nextStats, allWords, seenIds, initialPhase } = await loadQueue();
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

      const result: ExerciseResult = {
        exerciseId: wordId,
        slug: extras?.accuracy !== undefined ? "speak_word" : "fill_blank",
        exerciseTypeId: extras?.accuracy !== undefined ? 10 : 5,
        isCorrect: quality >= 3,
        userAnswer: extras?.transcript,
        contentId: wordId,
        context: "core-1000",
        timeMs: 0,
        score: extras?.accuracy,
        completedAt: new Date(),
      };

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
        setSessionSummary((prev) => ({
          practiced: (prev?.practiced ?? 0) + 1,
          correct: (prev?.correct ?? 0) + 1,
        }));
        advance(queue, index);
      } else {
        // Fail: re-insert ~3 positions ahead, defer SM-2 write to session end
        seenIdsRef.current.add(wordId);
        pendingLapsesRef.current.set(wordId, quality);
        persistPendingLapses();
        const newQueue = reinsertLearning(queue, index, item);
        setQueue(newQueue);
        sessionResultsRef.current.push(result);
        setSessionSummary((prev) => ({
          practiced: (prev?.practiced ?? 0) + 1,
          correct: prev?.correct ?? 0,
        }));
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
    setPhase(phaseForItem(newQueue[nextIndex]));
  }, [phase, queue, index, syncCounts]);

  const archiveWord = useCallback(async (word: string) => {
    await archiveCore1000Word(word);
    seenIdsRef.current.add(core1000WordId(word.toLowerCase()));
    const newQueue = queue.filter((_, i) => i !== index);
    setQueue(newQueue);
    if (newQueue.length === 0 || index >= newQueue.length) {
      void finishSession();
      return;
    }
    syncCounts(newQueue, index);
    setPhase(phaseForItem(newQueue[index]));
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
