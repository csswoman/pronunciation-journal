"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  appendNewBatch,
  deriveCounts,
  matchesFilter,
  reinsertLearning,
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

export function useEssentialWordsSession() {
  const { user } = useAuth();
  const [phase, setPhase] = useState<EssentialWordsPhase>("loading");
  const [planState, setPlanState] = useState<PlanSessionState | null>(null);
  const wordsByIdRef = useRef<Map<string, EssentialWord>>(new Map());
  const repetitionsByIdRef = useRef<Map<string, number | undefined>>(new Map());
  const [currentStep, setCurrentStep] = useState<PlanStep | null>(null);
  // The pure plan intentionally refuses a degenerate 1–2 word block. Keep the
  // existing single-card path for tiny filtered/test batches so that a narrow
  // route does not turn a usable session into an empty state.
  const [compatQueue, setCompatQueue] = useState<EssentialWordQueueItem[]>([]);
  const [compatIndex, setCompatIndex] = useState(0);
  const compatModeRef = useRef(false);
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

  const bootstrap = useCallback(async () => {
    const { items, stats: nextStats, allWords, seenIds } =
      await loadEssentialWordsQueue(levelsRef.current, posRef.current, user?.id);
    finishingRef.current = false;
    allWordsRef.current = allWords;
    seenIdsRef.current = seenIds;

    // A filtered queue can legitimately contain fewer than one complete
    // 3-word block. The pure Fase A engine leaves that remainder for a later
    // combined session; preserve the existing one-card UX for this edge case.
    if (items.length > 0 && items.length < 3) {
      compatModeRef.current = true;
      setCompatQueue(items);
      setCompatIndex(0);
      wordsByIdRef.current = new Map(items.map((item) => [essentialWordId(item.entry.word), item.entry]));
      repetitionsByIdRef.current = new Map(items.map((item) => [essentialWordId(item.entry.word), item.repetitions]));
      setPlanState(null);
      setCurrentStep(null);
      setStats(nextStats);
      setSessionSummary(null);
      sessionResultsRef.current = [];
      pendingLapsesRef.current = new Map();
      persistPendingLapses();
      setPreviousMode(undefined);
      setCounts(deriveCounts(items, 0));
      setPhase(items[0].kind === "new" ? "study" : "speak");
      return;
    }

    compatModeRef.current = false;
    setCompatQueue([]);
    setCompatIndex(0);

    const reviewWords = items.filter((i) => i.kind !== "new").map((i) => i.entry);
    const newWordsAll = items.filter((i) => i.kind === "new").map((i) => i.entry);
    const { reviewWords: keptReviews, newWords: keptNew } = truncateToTimeBudget({
      reviewWords, newWords: newWordsAll, budgetMs: SESSION_BUDGET_MS,
    });
    const planWords = [...keptReviews, ...keptNew];
    wordsByIdRef.current = new Map(planWords.map((w) => [essentialWordId(w.word), w]));
    repetitionsByIdRef.current = new Map(items.map((item) => [essentialWordId(item.entry.word), item.repetitions]));
    const nextPlanState = planWords.length > 0 ? createSessionPlan(planWords, Date.now()) : null;
    const first = nextPlanState ? planNextStep(nextPlanState, wordsByIdRef.current) : null;

    setPlanState(nextPlanState);
    setCurrentStep(first);
    setStats(nextStats);
    setSessionSummary(null);
    sessionResultsRef.current = [];
    pendingLapsesRef.current = new Map();
    persistPendingLapses();
    setPreviousMode(undefined);
    if (nextPlanState) setCounts(derivePlanCounts(nextPlanState));
    else setCounts(EMPTY_COUNTS);
    setPhase(first ? (first.kind === "expose" ? "study" : "speak") : "empty");
  }, [persistPendingLapses, user?.id]);

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
        if (cancelled) return;
        await bootstrap();
      } catch (err) {
        console.error("[EssentialWordsSession] initial load failed", err);
        if (!cancelled) setPhase("error");
      }
    })();
    return () => { cancelled = true; };
  }, [bootstrap, user?.id]);

  const advanceCompat = useCallback((queue: EssentialWordQueueItem[], index: number) => {
    const next = index + 1;
    if (next >= queue.length) {
      void finishSession();
      return;
    }
    setCompatQueue(queue);
    setCompatIndex(next);
    setCounts(deriveCounts(queue, next));
    setPhase(queue[next].kind === "new" ? "study" : "speak");
  }, [finishSession]);

  const startSpeak = useCallback(() => {
    if (!planState || !currentStep || currentStep.kind !== "expose") {
      setPhase("speak");
      return;
    }
    const wordId = essentialWordId(currentStep.word.word.toLowerCase());
    const nextPlanState = planApplyResult(planState, { wordId, level: 1, correct: true }, "expose");
    const next = planNextStep(nextPlanState, wordsByIdRef.current);
    setPlanState(nextPlanState);
    setCurrentStep(next);
    setCounts(derivePlanCounts(nextPlanState));
    if (!next) { void finishSession(); return; }
    setPhase(next.kind === "expose" ? "study" : "speak");
  }, [planState, currentStep, finishSession]);

  const submitGrade = useCallback(
    async (quality: number, extras?: GradeExtras) => {
      if (compatModeRef.current) {
        const item = compatQueue[compatIndex];
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
          advanceCompat(compatQueue, compatIndex);
        } else {
          seenIdsRef.current.add(wordId);
          pendingLapsesRef.current.set(wordId, quality);
          persistPendingLapses();
          const newQueue = reinsertLearning(compatQueue, compatIndex, item);
          sessionResultsRef.current.push(result);
          setSessionSummary((prev) => advanceSummary(prev, false));
          advanceCompat(newQueue, compatIndex);
        }
        return;
      }

      if (!planState || !currentStep || currentStep.kind !== "exercise") return;
      const wordId = essentialWordId(currentStep.word.word.toLowerCase());

      const result = buildEssentialWordExerciseResult(
        { entry: currentStep.word, kind: "review" }, quality, extras, currentModeRef.current,
      );
      setPreviousMode(currentModeRef.current);

      const correct = quality >= 3;
      if (correct) {
        await gradeEssentialWord(currentStep.word.word, quality, extras, user?.id);
        seenIdsRef.current.add(wordId);
        pendingLapsesRef.current.delete(wordId);
        persistPendingLapses();
        if (currentStep.level === 1) {
          await recordEssentialWordIntroduction(currentStep.word.word.toLowerCase(), user?.id);
          setStats((s) => ({ ...s, newToday: s.newToday + 1 }));
        }
        sessionResultsRef.current.push(result);
        setSessionSummary((prev) => advanceSummary(prev, true));
      } else {
        seenIdsRef.current.add(wordId);
        pendingLapsesRef.current.set(wordId, quality);
        persistPendingLapses();
        sessionResultsRef.current.push(result);
        setSessionSummary((prev) => advanceSummary(prev, false));
      }

      const nextPlanState = planApplyResult(planState, { wordId, level: currentStep.level, correct });
      const next = planNextStep(nextPlanState, wordsByIdRef.current);
      setPlanState(nextPlanState);
      setCurrentStep(next);
      setCounts(derivePlanCounts(nextPlanState));
      if (!next) { void finishSession(); return; }
      setPhase(next.kind === "expose" ? "study" : "speak");
    },
    [compatQueue, compatIndex, planState, currentStep, persistPendingLapses, user?.id, finishSession, advanceCompat],
  );

  const learnMore = useCallback(() => {
    if (compatModeRef.current) {
      const newQueue = appendNewBatch(
        compatQueue, allWordsRef.current, seenIdsRef.current, NEW_CARDS_PER_DAY, levelsRef.current, posRef.current,
      );
      setCompatQueue(newQueue);
      const nextIndex = phase === "done" ? compatQueue.length : Math.min(compatIndex, compatQueue.length);
      if (newQueue.length <= nextIndex) return;
      setCompatIndex(nextIndex);
      setCounts(deriveCounts(newQueue, nextIndex));
      setPhase(newQueue[nextIndex].kind === "new" ? "study" : "speak");
      return;
    }
    if (!planState) return;
    const inPlanIds = new Set(wordsByIdRef.current.keys());
    const batch = allWordsRef.current
      .filter((w) => {
        const id = essentialWordId(w.word);
        if (seenIdsRef.current.has(id) || inPlanIds.has(id)) return false;
        return matchesFilter(w, levelsRef.current, posRef.current);
      })
      .slice(0, NEW_CARDS_PER_DAY);
    if (batch.length === 0) return;
    for (const w of batch) wordsByIdRef.current.set(essentialWordId(w.word), w);
    const nextPlanState = appendWordsToPlan(planState, batch, Date.now());
    setPlanState(nextPlanState);
    setCounts(derivePlanCounts(nextPlanState));
    if (!currentStep) {
      const next = planNextStep(nextPlanState, wordsByIdRef.current);
      setCurrentStep(next);
      if (next) setPhase(next.kind === "expose" ? "study" : "speak");
    }
  }, [compatQueue, compatIndex, phase, planState, currentStep]);

  const removeCurrentAndAdvance = useCallback((word: string) => {
    if (compatModeRef.current) {
      seenIdsRef.current.add(essentialWordId(word.toLowerCase()));
      const newQueue = compatQueue.filter((_, i) => i !== compatIndex);
      setCompatQueue(newQueue);
      if (newQueue.length === 0 || compatIndex >= newQueue.length) {
        void finishSession();
        return;
      }
      setCounts(deriveCounts(newQueue, compatIndex));
      setPhase(newQueue[compatIndex].kind === "new" ? "study" : "speak");
      return;
    }
    if (!planState) return;
    const wordId = essentialWordId(word.toLowerCase());
    seenIdsRef.current.add(wordId);
    const nextPlanState = removeWordFromPlan(planState, wordId);
    const next = planNextStep(nextPlanState, wordsByIdRef.current);
    setPlanState(nextPlanState);
    setCurrentStep(next);
    setCounts(derivePlanCounts(nextPlanState));
    if (!next) { void finishSession(); return; }
    setPhase(next.kind === "expose" ? "study" : "speak");
  }, [compatQueue, compatIndex, planState, finishSession]);

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

  const compatCurrent = compatModeRef.current ? compatQueue[compatIndex] ?? null : null;
  const gatedStep = currentStep ? gateLevel3Mode(currentStep, ESSENTIAL_WORDS_LEVEL3_ENABLED) : null;
  const current: EssentialWordQueueItem | null = compatCurrent ?? (gatedStep
    ? {
        entry: gatedStep.word,
        kind: "review" as const,
        repetitions: gatedStep.kind === "exercise"
          ? repetitionsByIdRef.current.get(essentialWordId(gatedStep.word.word)) ?? gatedStep.level - 1
          : undefined,
      }
    : null);
  const currentMode: EssentialWordMode = compatCurrent
    ? selectMode(compatCurrent, previousMode)
    : gatedStep && gatedStep.kind === "exercise"
      ? gatedStep.mode
      : current
        ? selectMode(current, previousMode)
        : "speak_sentence";
  // Ref-mirror so submitGrade (a useCallback) reads the mode actually rendered,
  // without re-deriving it and without adding it to dependency arrays.
  const currentModeRef = useRef<EssentialWordMode>(currentMode);
  currentModeRef.current = currentMode;
  // Other words in this session, used as recognition distractors.
  const distractorPool = Array.from(wordsByIdRef.current.values()).filter(
    (w) => w.word !== current?.entry.word,
  );

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
