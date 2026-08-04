"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  reinsertLearning,
  deriveCounts,
  appendNewBatch,
  type EssentialWordQueueItem,
} from "@/lib/essential-words/queue";
import { gradeEssentialWord, type GradeExtras } from "@/lib/essential-words/grade";
import { essentialWordId, NEW_CARDS_PER_DAY, type CefrLevel, type EssentialWordPos, type EssentialWord } from "@/lib/essential-words/types";
import { getRoute } from "@/lib/essential-words/routes";
import { loadPendingLapses, savePendingLapses } from "@/lib/essential-words/pending-lapses";
import {
  loadEssentialWordsQueue,
  type EssentialWordsStats,
} from "@/lib/essential-words/session-loader";
import {
  advanceSummary,
  buildEssentialWordExerciseResult,
  phaseForEssentialWordItem,
  type EssentialWordsPhase,
  type EssentialWordsSessionSummary,
} from "@/lib/essential-words/session-model";
import { readStoredCefrLevel } from "@/lib/essential-words/target-level";
import { selectMode, type EssentialWordMode } from "@/lib/essential-words/exercise-modes";
import {
  createSessionPlan,
  nextStep as planNextStep,
  applyResult as planApplyResult,
  deriveCounts as derivePlanCounts,
  removeWord as removeWordFromPlan,
  appendWords as appendWordsToPlan,
  type SessionState as PlanSessionState,
} from "@/lib/essential-words/session-plan";
import type { Step as PlanStep } from "@/lib/essential-words/session-plan-types";
import { truncateToTimeBudget, SESSION_BUDGET_MS } from "@/lib/essential-words/session-plan-time-ceiling";
import { ESSENTIAL_WORDS_LEVEL3_ENABLED, gateLevel3Mode } from "@/lib/essential-words/level3-flag";
import { readGuestStudyLevel } from "@/lib/preferences/guest-study-level";
import {
  masterEssentialWord,
  recordEssentialWordIntroduction,
  snoozeEssentialWord,
} from "@/lib/db";
import { useAuth } from "@/components/auth/AuthProvider";
import { recordActivitySession } from "@/lib/progress/activity-hub";
import { buildSessionResult } from "@/lib/practice/session-result";
import type { ExerciseResult } from "@/lib/practice/types";

export type { EssentialWordsPhase, EssentialWordsSessionSummary } from "@/lib/essential-words/session-model";
export type { EssentialWordsStats } from "@/lib/essential-words/session-loader";

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

/** Internal-only toggle for the Fase A block-based engine. */
const USE_SESSION_PLAN_ENGINE = false;
void USE_SESSION_PLAN_ENGINE;

export function useEssentialWordsSession() {
  const { user } = useAuth();
  const [phase, setPhase] = useState<EssentialWordsPhase>("loading");
  const [queue, setQueue] = useState<EssentialWordQueueItem[]>([]);
  const [index, setIndex] = useState(0);
  const [stats, setStats] = useState<EssentialWordsStats>(EMPTY_STATS);
  const [counts, setCounts] = useState<EssentialWordsCounts>(EMPTY_COUNTS);
  const [sessionSummary, setSessionSummary] = useState<EssentialWordsSessionSummary | null>(null);
  const [reloadLoading, setReloadLoading] = useState(false);
  const [previousMode, setPreviousMode] = useState<EssentialWordMode | undefined>(undefined);

  const sessionResultsRef = useRef<ExerciseResult[]>([]);
  const finishingRef = useRef(false);
  // Pending lapses: wordId → quality — flushed to Dexie on session end
  const pendingLapsesRef = useRef<Map<string, number>>(new Map());
  const lapseFlushRef = useRef<Promise<void> | null>(null);
  const allWordsRef = useRef<EssentialWord[]>([]);
  const seenIdsRef = useRef<Set<string>>(new Set());
  // Active filter (null = all). Ephemeral, session-scoped. `routeId` is the
  // themed-route preset that drove the current level+pos, when any.
  const [levels, setLevelsState] = useState<CefrLevel[] | null>(null);
  const levelsRef = useRef<CefrLevel[] | null>(null);
  const [pos, setPosState] = useState<EssentialWordPos[] | null>(null);
  const posRef = useRef<EssentialWordPos[] | null>(null);
  const [activeRouteId, setActiveRouteId] = useState<string | null>(null);

  const persistPendingLapses = useCallback(() => {
    savePendingLapses(pendingLapsesRef.current);
  }, []);

  const syncCounts = useCallback((q: EssentialWordQueueItem[], i: number) => {
    setCounts(deriveCounts(q, i));
  }, []);

  const flushLapses = useCallback(async () => {
    if (lapseFlushRef.current) return lapseFlushRef.current;

    const flush = (async () => {
      const pending = Array.from(pendingLapsesRef.current.entries());
      for (const [wordId, quality] of pending) {
        const word = wordId.replace("c1k:", "");
        try {
          await gradeEssentialWord(word, quality, {}, user?.id);
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
      await recordActivitySession(user.id, { practiceContext: "essential-words", sessionResult });
      const { flushOutbox } = await import("@/lib/sync/sync-manager");
      await flushOutbox();
    } catch (err) {
      console.error("[EssentialWordsSession] recordActivitySession failed", err);
    } finally {
      finishingRef.current = false;
    }
  }, [user?.id, flushLapses]);

  const advance = useCallback((q: EssentialWordQueueItem[], i: number) => {
    const next = i + 1;
    if (next >= q.length) {
      void finishSession();
      return;
    }
    setIndex(next);
    syncCounts(q, next);
    setPhase(phaseForEssentialWordItem(q[next]));
  }, [finishSession, syncCounts]);

  const bootstrap = useCallback(async () => {
    const { items, stats: nextStats, allWords, seenIds, initialPhase } =
      await loadEssentialWordsQueue(levelsRef.current, posRef.current, user?.id);
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
    setPreviousMode(undefined);
    syncCounts(items, 0);
    setPhase(initialPhase);
  }, [persistPendingLapses, syncCounts]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Seed the level filter from the user's stored CEFR level (offline-safe)
        // so a placed learner starts at their level. Only when untouched (null).
        if (levelsRef.current === null) {
          const isGuest = !user || (user as { is_anonymous?: boolean }).is_anonymous;
          const level = isGuest ? readGuestStudyLevel() : await readStoredCefrLevel(user.id);
          if (!cancelled && level && level !== "A1") {
            levelsRef.current = [level];
            setLevelsState([level]);
          }
        }
        const { items, stats: nextStats, allWords, seenIds, initialPhase } =
          await loadEssentialWordsQueue(levelsRef.current, posRef.current, user?.id);
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
  }, [syncCounts, user?.id]);

  const startSpeak = useCallback(() => setPhase("speak"), []);

  const submitGrade = useCallback(
    async (quality: number, extras?: GradeExtras) => {
      const item = queue[index];
      if (!item) return;
      const wordId = essentialWordId(item.entry.word.toLowerCase());

      const result = buildEssentialWordExerciseResult(item, quality, extras, currentModeRef.current);
      setPreviousMode(currentModeRef.current);

      if (quality >= 3) {
        await gradeEssentialWord(item.entry.word, quality, extras, user?.id);
        seenIdsRef.current.add(wordId);
        pendingLapsesRef.current.delete(wordId);
        persistPendingLapses();
        if (item.kind === "new") {
          await recordEssentialWordIntroduction(item.entry.word.toLowerCase(), user?.id);
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
      queue, allWordsRef.current, seenIdsRef.current, NEW_CARDS_PER_DAY, levelsRef.current, posRef.current,
    );
    setQueue(newQueue);
    const nextIndex = phase === "done" ? queue.length : Math.min(index, queue.length);
    if (newQueue.length <= nextIndex) {
      return;
    }
    setIndex(nextIndex);
    syncCounts(newQueue, nextIndex);
    setPhase(phaseForEssentialWordItem(newQueue[nextIndex]));
  }, [phase, queue, index, syncCounts]);

  const removeCurrentAndAdvance = useCallback((word: string) => {
    seenIdsRef.current.add(essentialWordId(word.toLowerCase()));
    const newQueue = queue.filter((_, i) => i !== index);
    setQueue(newQueue);
    if (newQueue.length === 0 || index >= newQueue.length) {
      void finishSession();
      return;
    }
    syncCounts(newQueue, index);
    setPhase(phaseForEssentialWordItem(newQueue[index]));
  }, [queue, index, finishSession, syncCounts]);

  const archiveWord = useCallback(async (word: string) => {
    await snoozeEssentialWord(word, 90, user?.id);
    removeCurrentAndAdvance(word);
  }, [removeCurrentAndAdvance]);

  const keepSnooze = useCallback(async (word: string) => {
    await snoozeEssentialWord(word, 90, user?.id);
    removeCurrentAndAdvance(word);
  }, [removeCurrentAndAdvance]);

  const masterWord = useCallback(async (word: string) => {
    await masterEssentialWord(word, user?.id);
    removeCurrentAndAdvance(word);
  }, [removeCurrentAndAdvance]);

  const reload = useCallback(async () => {
    setReloadLoading(true);
    try { await bootstrap(); }
    finally { setReloadLoading(false); }
  }, [bootstrap]);

  const setLevels = useCallback(async (next: CefrLevel[] | null) => {
    const normalized = next && next.length > 0 ? next : null;
    levelsRef.current = normalized;
    posRef.current = null;
    setLevelsState(normalized);
    setPosState(null);
    setActiveRouteId(null);
    setPhase("loading");
    await bootstrap();
  }, [bootstrap]);

  const setRoute = useCallback(async (routeId: string | null) => {
    const route = getRoute(routeId);
    levelsRef.current = route ? route.levels : null;
    posRef.current = route && route.pos.length > 0 ? route.pos : null;
    setLevelsState(levelsRef.current);
    setPosState(posRef.current);
    setActiveRouteId(route ? route.id : null);
    setPhase("loading");
    await bootstrap();
  }, [bootstrap]);

  const current = queue[index] ?? null;
  const currentMode: EssentialWordMode = current
    ? selectMode(current, previousMode)
    : "speak_sentence";
  // Ref-mirror so submitGrade (a useCallback) reads the mode actually rendered,
  // without re-deriving it and without adding it to dependency arrays.
  const currentModeRef = useRef<EssentialWordMode>(currentMode);
  currentModeRef.current = currentMode;
  // Other words in this session, used as recognition distractors.
  const distractorPool = queue
    .filter((_, i) => i !== index)
    .map((qi) => qi.entry);

  return {
    phase,
    current,
    currentMode,
    distractorPool,
    stats,
    counts,
    sessionSummary,
    reloadLoading,
    levels,
    setLevels,
    pos,
    activeRouteId,
    setRoute,
    startSpeak,
    submitGrade,
    reload,
    learnMore,
    archiveWord,
    keepSnooze,
    masterWord,
  };
}
