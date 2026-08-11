"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  matchesFilter,
  type EssentialWordQueueItem,
} from "@/lib/essential-words/queue";
import { gradeEssentialWord, type GradeExtras } from "@/lib/essential-words/grade";
import { essentialWordId, GUIDED_SESSION_NEW_CARDS, type CefrLevel, type EssentialWordPos, type EssentialWord } from "@/lib/essential-words/types";
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
import { modeHasData, selectMode, type EssentialWordMode } from "@/lib/essential-words/exercise-modes";
import { resolveRenderedSkillMode } from "@/lib/essential-words/rendered-skill-mode";
import type { Step as PlanStep } from "@/lib/essential-words/session-plan-types";
import { ESSENTIAL_WORDS_LEVEL3_ENABLED, gateLevel3Mode } from "@/lib/essential-words/level3-flag";
import { readGuestStudyLevel } from "@/lib/preferences/guest-study-level";
import {
  archiveEssentialWordProgress,
  getEssentialWordProgressForUser,
  saveEssentialWordProgress,
  masterEssentialWord,
  recordEssentialWordIntroduction,
  snoozeEssentialWord,
} from "@/lib/db";
import { useAuth } from "@/components/auth/AuthProvider";
import { recordActivitySession } from "@/lib/progress/activity-hub";
import { buildSessionResult } from "@/lib/practice/session-result";
import { saveLastEssentialWordsSession } from "@/lib/essential-words/ready-last-session";
import {
  readSessionSizePreference,
  sessionSizeById,
  writeSessionSizePreference,
  type SessionSizeId,
} from "@/lib/essential-words/session-size";
import type { ExerciseResult } from "@/lib/practice/types";
import {
  createEssentialWordsRuntime,
  type RuntimeAttemptInput,
} from "@/lib/essential-words/runtime-engine";
import {
  toKnownClaimQueueItem,
  type SkillRuntimeQueueItem,
} from "@/lib/essential-words/runtime-adapter";
import type { AttemptOutcome } from "@/lib/essential-words/attempt-grade";
import {
  claimKnownInActionSession,
  completeCurrentAction,
  createActionSession,
  deriveActionSessionPreview,
  removeWordFromActionSession,
  type ActionSessionState,
  type EssentialWordsSessionPreview,
  type SessionCandidate,
} from "@/lib/essential-words/action-session";
import { resumeState } from "@/lib/essential-words/essential-word-progress";
import {
  clearEssentialWordsSessionDraft,
  loadEssentialWordsSessionDraft,
  saveEssentialWordsSessionDraft,
  type EssentialWordsSessionDraft,
} from "@/lib/essential-words/session-draft";

export type { EssentialWordsPhase, EssentialWordsSessionSummary } from "@/lib/essential-words/session-model";
export type { EssentialWordsStats } from "@/lib/essential-words/session-loader";

export interface SessionProgress {
  current: number;
  total: number;
}

export interface EssentialWordsCounts {
  newRemaining: number;
  learningRemaining: number;
  reviewRemaining: number;
}

const EMPTY_STATS: EssentialWordsStats = {
  totalWords: 0, learned: 0, dueCount: 0, dueTomorrow: 0, newToday: 0, newQuota: GUIDED_SESSION_NEW_CARDS, vaulted: 0,
};
const EMPTY_COUNTS: EssentialWordsCounts = {
  newRemaining: 0, learningRemaining: 0, reviewRemaining: 0,
};

function countsFromPreview(preview: EssentialWordsSessionPreview): EssentialWordsCounts {
  return {
    newRemaining: preview.newWordCount,
    learningRemaining: preview.continuationActionCount,
    reviewRemaining: preview.reviewActionCount,
  };
}

export function useEssentialWordsSession() {
  const { user } = useAuth();
  const [phase, setPhase] = useState<EssentialWordsPhase>("loading");
  const phaseRef = useRef<EssentialWordsPhase>(phase);
  phaseRef.current = phase;
  const [planState, setPlanState] = useState<ActionSessionState | null>(null);
  const planStateRef = useRef<ActionSessionState | null>(null);
  const wordsByIdRef = useRef<Map<string, EssentialWord>>(new Map());
  const repetitionsByIdRef = useRef<Map<string, number | undefined>>(new Map());
  const progressByWordRef = useRef(new Map<string, Awaited<ReturnType<typeof getEssentialWordProgressForUser>>[number]>());
  const activeStepIdRef = useRef<string | null>(null);
  const [stats, setStats] = useState<EssentialWordsStats>(EMPTY_STATS);
  const [counts, setCounts] = useState<EssentialWordsCounts>(EMPTY_COUNTS);
  const [sessionSummary, setSessionSummary] = useState<EssentialWordsSessionSummary | null>(null);
  const [strugglingWords, setStrugglingWords] = useState<string[]>([]);
  const [reloadLoading, setReloadLoading] = useState(false);
  const [previousMode, setPreviousMode] = useState<EssentialWordMode | undefined>(undefined);
  const [sessionProgress, setSessionProgress] = useState<SessionProgress | null>(null);
  const [sessionPreview, setSessionPreview] = useState<EssentialWordsSessionPreview | null>(null);
  const [isResume, setIsResume] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const sessionActiveRef = useRef(false);
  const seenStepIdsRef = useRef<Set<string>>(new Set());
  const runtimeRef = useRef<Awaited<ReturnType<typeof createEssentialWordsRuntime>> | null>(null);
  const skillItemsByWordRef = useRef<Map<string, SkillRuntimeQueueItem>>(new Map());
  const skillModeRef = useRef(false);
  const skillPlannerModeRef = useRef<"normal" | "recovery">("normal");
  const sessionIdRef = useRef(crypto.randomUUID());
  const draftWriteRef = useRef<Promise<void>>(Promise.resolve());

  const sessionResultsRef = useRef<ExerciseResult[]>([]);
  const finishingRef = useRef(false);
  const sessionStartedAtRef = useRef<number | null>(null);
  const activeElapsedMsRef = useRef(0);
  const stepPresentedAtRef = useRef<number | null>(null);
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
  const [sessionSize, setSessionSizeState] = useState<SessionSizeId>(() => readSessionSizePreference());
  const sessionSizeRef = useRef<SessionSizeId>(sessionSize);
  sessionSizeRef.current = sessionSize;
  const leechWordIdsRef = useRef<string[] | null>(null);
  const draftMetaRef = useRef<Pick<EssentialWordsSessionDraft, 'source' | 'createdAt'> | null>(null);
  const requestGenerationRef = useRef(0);

  const clearDraft = useCallback(async () => {
    if (!user?.id) return;
    const clear = draftWriteRef.current
      .catch(() => undefined)
      .then(() => clearEssentialWordsSessionDraft(user.id));
    draftWriteRef.current = clear;
    await clear;
  }, [user?.id]);

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

  const markStepPresented = useCallback(() => {
    stepPresentedAtRef.current = Date.now();
  }, []);

  const elapsedStepMs = useCallback(() => {
    const started = stepPresentedAtRef.current;
    if (started == null) return 0;
    return Math.max(0, Date.now() - started);
  }, []);

  const finishSession = useCallback(async () => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    sessionActiveRef.current = false;
    setPhase("done");
    // Snapshot before flushLapses() mutates/clears pendingLapsesRef — flushing
    // deletes each entry as it persists, so reading the ref after would miss
    // (or fully lose) the words that actually struggled this session.
    setStrugglingWords(
      Array.from(pendingLapsesRef.current.keys()).map((wordId) => wordId.replace("c1k:", "")),
    );
    await flushLapses();
    if (!user?.id) {
      finishingRef.current = false;
      return;
    }
    const built = buildSessionResult(sessionResultsRef.current);
    const activeSegmentMs = sessionStartedAtRef.current
      ? Math.max(0, Date.now() - sessionStartedAtRef.current)
      : 0;
    const sessionResult = {
      ...built,
      totalTimeMs: activeElapsedMsRef.current + activeSegmentMs || built.totalTimeMs,
    };
    try {
      await clearDraft();
    } catch (err) {
      console.error("[EssentialWordsSession] draft cleanup failed", err);
    }
    try {
      await recordActivitySession(user.id, { practiceContext: "essential-words", sessionResult });
      saveLastEssentialWordsSession(user.id, {
        practiced: sessionResult.results.length,
        correct: sessionResult.results.filter((r) => r.isCorrect).length,
        durationMs: sessionResult.totalTimeMs,
        completedAt: new Date().toISOString(),
      });
      const { flushOutbox } = await import("@/lib/sync/sync-manager");
      await flushOutbox(user.id);
    } catch (err) {
      console.error("[EssentialWordsSession] recordActivitySession failed", err);
    } finally {
      sessionStartedAtRef.current = null;
      activeElapsedMsRef.current = 0;
      stepPresentedAtRef.current = null;
      finishingRef.current = false;
    }
  }, [user?.id, flushLapses, clearDraft]);

  const bootstrap = useCallback(async () => {
    const generation = ++requestGenerationRef.current;
    if (phaseRef.current === 'ready') setPreviewLoading(true);
    try {
    const storedDraft = user?.id ? await loadEssentialWordsSessionDraft(user.id) : null;
    if (storedDraft) {
      sessionSizeRef.current = storedDraft.sizeId;
      levelsRef.current = storedDraft.levels;
      posRef.current = storedDraft.pos;
    }
    const { actionBudget, maxNewWords } = sessionSizeById(sessionSizeRef.current);
    const runtime = user?.id ? await createEssentialWordsRuntime(user.id) : null;
    const [loaded, progressRecords] = await Promise.all([
      runtime
        ? runtime.buildSession({
        levels: levelsRef.current,
        pos: posRef.current,
        now: new Date(),
        previousMode: skillPlannerModeRef.current,
        maxNewWords,
      })
        : loadEssentialWordsQueue(levelsRef.current, posRef.current, user?.id, { maxNewWords })
          .then((session) => ({ source: "legacy" as const, ...session })),
      user?.id ? getEssentialWordProgressForUser(user.id) : Promise.resolve([]),
    ]);
    if (generation !== requestGenerationRef.current) return;
    runtimeRef.current = runtime;
    const { stats: nextStats, allWords, seenIds } = loaded;
    let { items } = loaded;

    const leechIds = leechWordIdsRef.current;
    if (leechIds && leechIds.length > 0) {
      const wanted = new Set(leechIds);
      items = items.filter((item) => wanted.has(essentialWordId(item.entry.word)));
      leechWordIdsRef.current = null;
    }
    skillModeRef.current = loaded.source === "skill";
    if ("skillPlan" in loaded && loaded.skillPlan) {
      skillPlannerModeRef.current = loaded.skillPlan.allowance.mode;
    }
    sessionIdRef.current = storedDraft?.sessionId ?? crypto.randomUUID();
    finishingRef.current = false;
    allWordsRef.current = allWords;
    seenIdsRef.current = seenIds;

    const skillItems = items.filter((item) => "plannedItem" in item) as SkillRuntimeQueueItem[];
    skillItemsByWordRef.current = new Map(
      skillItems.map((item) => [essentialWordId(item.entry.word), item]),
    );

    wordsByIdRef.current = new Map(allWords.map((word) => [essentialWordId(word.word), word]));
    repetitionsByIdRef.current = new Map(items.map((item) => [essentialWordId(item.entry.word), item.repetitions]));
    const continuationIds = new Set(progressRecords.map((record) => record.wordId));
    progressByWordRef.current = new Map(progressRecords.map((record) => [record.wordId, record]));
    const continuations: SessionCandidate[] = progressRecords.flatMap((record): SessionCandidate[] => {
      const entry = wordsByIdRef.current.get(record.wordId);
      if (!entry || !matchesFilter(entry, levelsRef.current, posRef.current)) return [];
      if (loaded.source === 'skill' && !skillItemsByWordRef.current.has(record.wordId)) return [];
      const decision = resumeState(record, new Date());
      if (decision.kind === 'resume_final_round') {
        return [{ entry, source: 'continuation' as const, resumeFromLevel: 'final' as const, includeExposure: false }];
      }
      if (decision.kind === 'resume_no_exposure') {
        return [{ entry, source: 'continuation' as const, resumeFromLevel: decision.fromLevel, includeExposure: false }];
      }
      return [{ entry, source: 'continuation' as const, resumeFromLevel: 1 as const, includeExposure: true }];
    });
    const candidates: SessionCandidate[] = [
      ...continuations,
      ...items.filter((item) => !continuationIds.has(essentialWordId(item.entry.word))).map((item) => ({
        entry: item.entry,
        source: item.kind === 'new' ? 'new' as const : 'review' as const,
        repetitions: item.repetitions,
        fromSnooze: item.fromSnooze,
        forcedMode: 'forcedMode' in item
          ? item.forcedMode
          : item.fromSnooze
            ? 'speak_sentence'
            : undefined,
      })),
    ];
    let nextPlanState = createActionSession(candidates, actionBudget);
    let resumed = false;
    if (storedDraft && storedDraft.source === loaded.source) {
      const wordIds = [...storedDraft.plan.pending, ...storedDraft.plan.reserve].map((action) => action.wordId);
      const canRehydrate = wordIds.every((id) =>
        wordsByIdRef.current.has(id)
        && (loaded.source !== 'skill' || skillItemsByWordRef.current.has(id)),
      );
      if (canRehydrate) {
        nextPlanState = storedDraft.plan;
        resumed = true;
      } else if (user?.id) {
        await clearDraft();
      }
    } else if (storedDraft && user?.id) {
      await clearDraft();
    }
    const preview = deriveActionSessionPreview(nextPlanState);

    setPlanState(nextPlanState);
    planStateRef.current = nextPlanState;
    setSessionPreview(preview);
    setStats(nextStats);
    setSessionSummary(resumed ? storedDraft?.summary ?? null : null);
    setStrugglingWords([]);
    sessionActiveRef.current = false;
    seenStepIdsRef.current.clear();
    setSessionProgress(null);
    sessionResultsRef.current = resumed ? storedDraft?.results ?? [] : [];
    if (resumed && storedDraft) {
      progressByWordRef.current = new Map(
        storedDraft.progress.map((record) => [record.wordId, record]),
      );
    }
    activeElapsedMsRef.current = resumed ? storedDraft?.activeElapsedMs ?? 0 : 0;
    pendingLapsesRef.current = new Map();
    persistPendingLapses();
    setPreviousMode(undefined);
    setCounts(countsFromPreview(preview));
    setIsResume(resumed);
    if (resumed && storedDraft) {
      setSessionSizeState(storedDraft.sizeId);
      setLevelsState(storedDraft.levels);
      setPosState(storedDraft.pos);
      setActiveRouteId(storedDraft.routeId);
      draftMetaRef.current = { source: storedDraft.source, createdAt: storedDraft.createdAt };
    } else {
      draftMetaRef.current = { source: loaded.source, createdAt: new Date().toISOString() };
    }
    setPhase(nextPlanState.pending.length > 0 ? "ready" : "empty");
    } catch (error) {
      if (generation === requestGenerationRef.current) throw error;
    } finally {
      if (generation === requestGenerationRef.current) setPreviewLoading(false);
    }
  }, [persistPendingLapses, user?.id, clearDraft]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Seed the level filter from the user's stored CEFR level (offline-safe)
        // so a placed learner starts at their level. Only when untouched (null).
        if (levelsRef.current === null) {
          const { isAnonymousUser } = await import("@/lib/auth/is-anonymous");
          const isGuest = isAnonymousUser(user);
          const level = isGuest
            ? readGuestStudyLevel()
            : user
              ? await readStoredCefrLevel(user.id)
              : null;
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

  const currentAction = planState?.pending[0] ?? null;
  const currentWord = currentAction ? wordsByIdRef.current.get(currentAction.wordId) ?? null : null;
  const currentStep: PlanStep | null = currentAction && currentWord
    ? currentAction.kind === 'exposure'
      ? { id: currentAction.id, kind: 'expose', word: currentWord }
      : {
          id: currentAction.id,
          kind: 'exercise',
          word: currentWord,
          level: currentAction.level ?? 3,
          mode: currentAction.mode ?? 'speak_sentence',
        }
    : null;

  const syncPlanState = useCallback((next: ActionSessionState) => {
    planStateRef.current = next;
    setPlanState(next);
    const preview = deriveActionSessionPreview(next);
    setSessionPreview(preview);
    setCounts(countsFromPreview(preview));
    if (sessionActiveRef.current) {
      const plannedTotal = Math.max(next.completedActions + next.pending.length, 1);
      setSessionProgress({
        current: Math.min(next.completedActions + 1, plannedTotal),
        total: plannedTotal,
      });
    }
  }, []);

  const persistDraft = useCallback((next: ActionSessionState) => {
    if (!user?.id || !draftMetaRef.current) return;
    const now = new Date().toISOString();
    const activeSegmentMs = sessionStartedAtRef.current
      ? Math.max(0, Date.now() - sessionStartedAtRef.current)
      : 0;
    const results = [...sessionResultsRef.current];
    const snapshot: EssentialWordsSessionDraft = {
      userId: user.id,
      version: 1,
      sessionId: sessionIdRef.current,
      source: draftMetaRef.current.source,
      sizeId: sessionSizeRef.current,
      routeId: activeRouteId,
      levels: levelsRef.current,
      pos: posRef.current,
      plan: next,
      results,
      progress: Array.from(progressByWordRef.current.values()),
      summary: {
        practiced: results.length,
        correct: results.filter((result) => result.isCorrect).length,
      },
      activeElapsedMs: activeElapsedMsRef.current + activeSegmentMs,
      createdAt: draftMetaRef.current.createdAt,
      updatedAt: now,
    };
    const write = draftWriteRef.current
      .catch(() => undefined)
      .then(() => saveEssentialWordsSessionDraft(snapshot));
    draftWriteRef.current = write;
    void write.catch((error) => console.error('[EssentialWordsSession] draft save failed', error));
    return write;
  }, [activeRouteId, user?.id]);

  const pauseAndPersistSession = useCallback(async () => {
    const current = planStateRef.current;
    if (!sessionActiveRef.current || !current) return;
    if (sessionStartedAtRef.current) {
      activeElapsedMsRef.current += Math.max(0, Date.now() - sessionStartedAtRef.current);
      sessionStartedAtRef.current = null;
    }
    await persistDraft(current);
  }, [persistDraft]);

  useEffect(() => {
    const handlePageHide = () => {
      void pauseAndPersistSession();
    };
    const handlePageShow = () => {
      if (sessionActiveRef.current && sessionStartedAtRef.current === null) {
        sessionStartedAtRef.current = Date.now();
      }
    };
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('pageshow', handlePageShow);
    return () => {
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [pauseAndPersistSession]);

  const persistLearningStep = useCallback(async (
    action: NonNullable<typeof currentAction>,
    correct: boolean,
  ) => {
    if (!user?.id || action.source === 'review') return;
    const now = new Date().toISOString();
    const previous = progressByWordRef.current.get(action.wordId);
    if (action.final && correct) {
      await archiveEssentialWordProgress(action.wordId, user.id);
      progressByWordRef.current.delete(action.wordId);
      return;
    }
    const highestLevel = action.kind === 'exercise' && correct
      ? Math.max(previous?.highestLevel ?? 0, action.level ?? 0) as 0 | 1 | 2 | 3
      : previous?.highestLevel ?? 0;
    const record = {
      wordId: action.wordId,
      userId: user.id,
      exposedAt: previous?.exposedAt ?? now,
      highestLevel,
      lastLevelAt: now,
      lastSessionId: sessionIdRef.current,
      attempts: (previous?.attempts ?? 0) + (action.kind === 'exercise' ? 1 : 0),
    };
    await saveEssentialWordProgress(record);
    progressByWordRef.current.set(action.wordId, { ...record, id: `${user.id}:${action.wordId}` });
  }, [user?.id]);

  const startSpeak = useCallback(async () => {
    if (!planState || !currentStep || !currentAction || currentStep.kind !== "expose") {
      setPhase("speak");
      markStepPresented();
      return;
    }
    await persistLearningStep(currentAction, true);
    const nextPlanState = completeCurrentAction(planState);
    syncPlanState(nextPlanState);
    persistDraft(nextPlanState);
    if (nextPlanState.completedActions >= nextPlanState.actionBudget || nextPlanState.pending.length === 0) {
      void finishSession();
      return;
    }
    markStepPresented();
    setPhase(nextPlanState.pending[0]?.kind === "exposure" ? "study" : "speak");
  }, [planState, currentStep, currentAction, finishSession, markStepPresented, persistDraft, persistLearningStep, syncPlanState]);

  const beginSession = useCallback(() => {
    if (phase !== "ready" || !planState || previewLoading) return;
    sessionActiveRef.current = true;
    sessionStartedAtRef.current = Date.now();
    markStepPresented();
    seenStepIdsRef.current.clear();
    const plannedTotal = Math.max(planState.completedActions + planState.pending.length, 1);
    setSessionProgress({
      current: Math.min(planState.completedActions + 1, plannedTotal),
      total: plannedTotal,
    });
    persistDraft(planState);
    setPhase(currentStep && currentStep.kind === "expose" ? "study" : "speak");
  }, [phase, currentStep, planState, previewLoading, markStepPresented, persistDraft]);

  const submitGrade = useCallback(
    async (
      quality: number,
      extras?: GradeExtras,
      expectedStepId?: string,
      outcome?: AttemptOutcome,
    ) => {
      if (expectedStepId && expectedStepId !== activeStepIdRef.current) return;
      if (!planState || !currentStep || !currentAction || currentStep.kind !== "exercise") return;
      const wordId = currentAction.wordId;
      const claimedKnown = planState.claimedKnownWordIds.includes(wordId);
      const isFinalRound = currentAction.final === true;

      const result = buildEssentialWordExerciseResult(
        { entry: currentStep.word, kind: "review" },
        quality,
        extras,
        currentModeRef.current,
        elapsedStepMs(),
      );
      setPreviousMode(currentModeRef.current);

      const correct = quality >= 3;
      const previousProgressLevel = progressByWordRef.current.get(wordId)?.highestLevel ?? 0;
      if (skillModeRef.current) {
        const baseItem = skillItemsByWordRef.current.get(wordId);
        if (!baseItem || !outcome || !runtimeRef.current) {
          throw new Error("El intento skill requiere evidencia y una palabra planificada");
        }
        await runtimeRef.current.recordAttempt({
          item: {
            ...baseItem,
            eventType: isFinalRound || currentAction.source === 'review' ? baseItem.eventType : "practice",
          },
          outcome,
          quality,
          extras,
          sessionId: sessionIdRef.current,
          renderedMode: currentModeRef.current,
        } satisfies RuntimeAttemptInput);
      } else if (correct && claimedKnown && isFinalRound) {
        // Deferred Omitir verification passed → archive (90d snooze).
        await snoozeEssentialWord(currentStep.word.word, 90, user?.id);
      } else if (correct) {
        if (runtimeRef.current && outcome) {
          await runtimeRef.current.recordAttempt({
            item: { entry: currentStep.word, kind: "review" },
            outcome,
            quality,
            extras,
            sessionId: sessionIdRef.current,
            renderedMode: currentModeRef.current,
          } satisfies RuntimeAttemptInput);
        } else {
          await gradeEssentialWord(currentStep.word.word, quality, extras, user?.id);
        }
      } else {
        if (runtimeRef.current && outcome) {
          await runtimeRef.current.recordAttempt({
            item: { entry: currentStep.word, kind: "review" },
            outcome,
            quality,
            extras,
            sessionId: sessionIdRef.current,
            renderedMode: currentModeRef.current,
            persistLegacySrs: false,
          } satisfies RuntimeAttemptInput);
        }
      }
      seenIdsRef.current.add(wordId);
      if (correct) pendingLapsesRef.current.delete(wordId);
      else pendingLapsesRef.current.set(wordId, quality);
      persistPendingLapses();
      if (
        correct
        && currentAction.source !== 'review'
        && currentStep.level === 1
        && previousProgressLevel < 1
      ) {
        await recordEssentialWordIntroduction(currentStep.word.word.toLowerCase(), user?.id);
        setStats((state) => ({ ...state, newToday: state.newToday + 1, learned: state.learned + 1 }));
      }
      await persistLearningStep(currentAction, correct);
      sessionResultsRef.current.push(result);
      setSessionSummary((prev) => advanceSummary(prev, correct));
      let nextPlanState = completeCurrentAction(planState, {
        retry: !correct && currentAction.source !== 'review' && !claimedKnown,
      });
      if (claimedKnown && isFinalRound) {
        nextPlanState = {
          ...nextPlanState,
          claimedKnownWordIds: nextPlanState.claimedKnownWordIds.filter((id) => id !== wordId),
        };
      }
      syncPlanState(nextPlanState);
      persistDraft(nextPlanState);
      if (nextPlanState.completedActions >= nextPlanState.actionBudget || nextPlanState.pending.length === 0) {
        void finishSession();
        return;
      }
      markStepPresented();
      setPhase(nextPlanState.pending[0]?.kind === "exposure" ? "study" : "speak");
    },
    [planState, currentStep, currentAction, persistPendingLapses, user?.id, finishSession, elapsedStepMs, markStepPresented, persistDraft, persistLearningStep, syncPlanState],
  );

  const learnMore = useCallback(async () => {
    await clearDraft();
    sessionIdRef.current = crypto.randomUUID();
    activeElapsedMsRef.current = 0;
    sessionStartedAtRef.current = null;
    setIsResume(false);
    setPhase("loading");
    await bootstrap();
  }, [bootstrap, clearDraft]);

  const removeCurrentAndAdvance = useCallback((word: string) => {
    if (!planState) return;
    const wordId = essentialWordId(word.toLowerCase());
    seenIdsRef.current.add(wordId);
    const nextPlanState = removeWordFromActionSession(planState, wordId);
    syncPlanState(nextPlanState);
    persistDraft(nextPlanState);
    if (nextPlanState.pending.length === 0) { void finishSession(); return; }
    setPhase(nextPlanState.pending[0]?.kind === "exposure" ? "study" : "speak");
  }, [finishSession, persistDraft, planState, syncPlanState]);

  const archiveWord = useCallback(async (word: string) => {
    if (skillModeRef.current) {
      removeCurrentAndAdvance(word);
      return;
    }
    await snoozeEssentialWord(word, 90, user?.id);
    removeCurrentAndAdvance(word);
  }, [removeCurrentAndAdvance, user?.id]);

  /** Skip in-block practice; verify near session end. Correct → archive. */
  const omitWord = useCallback(() => {
    if (!planState || !currentStep || currentStep.kind !== "expose") return;
    const wordId = essentialWordId(currentStep.word.word.toLowerCase());
    let verificationMode: EssentialWordMode = modeHasData(currentStep.word, 'cloze_sentence')
      ? 'cloze_sentence'
      : 'speak_sentence';
    if (skillModeRef.current) {
      const baseItem = skillItemsByWordRef.current.get(wordId);
      const verification = baseItem ? toKnownClaimQueueItem(baseItem) : null;
      if (!verification) {
        removeCurrentAndAdvance(currentStep.word.word);
        return;
      }
      skillItemsByWordRef.current.set(wordId, verification);
      verificationMode = verification.forcedMode;
    }
    const nextPlanState = claimKnownInActionSession(planState, wordId, verificationMode);
    syncPlanState(nextPlanState);
    persistDraft(nextPlanState);
    if (nextPlanState.pending.length === 0) { void finishSession(); return; }
    setPhase(nextPlanState.pending[0]?.kind === "exposure" ? "study" : "speak");
  }, [planState, currentStep, finishSession, persistDraft, removeCurrentAndAdvance, syncPlanState]);

  const keepSnooze = useCallback(async (word: string) => {
    if (skillModeRef.current) {
      removeCurrentAndAdvance(word);
      return;
    }
    await snoozeEssentialWord(word, 90, user?.id);
    removeCurrentAndAdvance(word);
  }, [removeCurrentAndAdvance, user?.id]);

  const masterWord = useCallback(async (word: string) => {
    if (skillModeRef.current) {
      removeCurrentAndAdvance(word);
      return;
    }
    await masterEssentialWord(word, user?.id);
    removeCurrentAndAdvance(word);
  }, [removeCurrentAndAdvance]);

  const reload = useCallback(async () => {
    setReloadLoading(true);
    try { await bootstrap(); }
    finally { setReloadLoading(false); }
  }, [bootstrap]);

  const reloadQuietlyOrFlash = useCallback(async () => {
    // Stay on ready while preferences change — flashing "loading" remounts the
    // whole SessionReady tree and looks like a page blink.
    if (phaseRef.current !== "ready") {
      setPhase("loading");
    }
    await bootstrap();
  }, [bootstrap]);

  const setLevels = useCallback(async (next: CefrLevel[] | null) => {
    if (isResume) return;
    const normalized = next && next.length > 0 ? next : null;
    levelsRef.current = normalized;
    posRef.current = null;
    setLevelsState(normalized);
    setPosState(null);
    setActiveRouteId(null);
    await reloadQuietlyOrFlash();
  }, [isResume, reloadQuietlyOrFlash]);

  const setRoute = useCallback(async (routeId: string | null) => {
    if (isResume) return;
    const route = getRoute(routeId);
    levelsRef.current = route ? route.levels : null;
    posRef.current = route && route.pos.length > 0 ? route.pos : null;
    setLevelsState(levelsRef.current);
    setPosState(posRef.current);
    setActiveRouteId(route ? route.id : null);
    await reloadQuietlyOrFlash();
  }, [isResume, reloadQuietlyOrFlash]);

  const setSessionSize = useCallback((id: SessionSizeId) => {
    if (isResume) return;
    writeSessionSizePreference(id);
    setSessionSizeState(id);
    sessionSizeRef.current = id;
    void reloadQuietlyOrFlash();
  }, [isResume, reloadQuietlyOrFlash]);

  const discardSession = useCallback(async () => {
    await clearDraft();
    sessionIdRef.current = crypto.randomUUID();
    activeElapsedMsRef.current = 0;
    setIsResume(false);
    setPhase('loading');
    await bootstrap();
  }, [bootstrap, clearDraft]);

  const startLeechReview = useCallback((wordIds: string[]) => {
    if (isResume || wordIds.length === 0) return;
    leechWordIdsRef.current = wordIds.map((id) =>
      id.startsWith("c1k:") ? id : essentialWordId(id),
    );
    setPhase("loading");
    void bootstrap();
  }, [bootstrap, isResume]);

  const gatedStep = currentStep ? gateLevel3Mode(currentStep, ESSENTIAL_WORDS_LEVEL3_ENABLED) : null;
  const currentStepId = gatedStep?.id ?? null;
  activeStepIdRef.current = currentStepId;

  const studyContext = phase === "study" && currentAction?.source === 'continuation'
    ? 'Retoma esta palabra desde el último punto guardado'
    : undefined;
  const currentExerciseLevel =
    gatedStep?.kind === 'exercise' ? gatedStep.level : null
  const current: EssentialWordQueueItem | null = gatedStep
    ? {
        entry: gatedStep.word,
        kind: currentAction?.source === 'new'
          ? "new" as const
          : currentAction?.source === 'continuation'
            ? "learning" as const
            : "review" as const,
        repetitions: gatedStep.kind === "exercise"
          ? repetitionsByIdRef.current.get(essentialWordId(gatedStep.word.word)) ?? gatedStep.level - 1
          : undefined,
        fromSnooze: currentAction?.fromSnooze,
      }
    : null;
  const skillItem: SkillRuntimeQueueItem | undefined = skillModeRef.current && current
    ? skillItemsByWordRef.current.get(essentialWordId(current.entry.word))
    : undefined;
  const currentMode: EssentialWordMode = gatedStep && gatedStep.kind === "exercise"
      ? skillItem
        ? resolveRenderedSkillMode(gatedStep.word, gatedStep.mode, skillItem)
        : gatedStep.mode
      : current
        ? selectMode(current, previousMode)
        : "speak_sentence";
  // Ref-mirror so submitGrade (a useCallback) reads the mode actually rendered,
  // without re-deriving it and without adding it to dependency arrays.
  const currentModeRef = useRef<EssentialWordMode>(currentMode);
  currentModeRef.current = currentMode;
  const listeningTier = skillItem?.listeningLadder?.level;
  const isListeningSkill = skillItem?.plannedItem.skill === 'listening';
  const focusContrastId = skillItem?.focusContrastId;
  const retiredBlankKeys = skillItem?.retiredBlankKeys;
  // Recognition needs varied alternatives, not the two other words in a short session.
  const audioDistractorPool = allWordsRef.current;

  return {
    phase,
    currentStepId,
    current,
    currentMode,
    listeningTier,
    isListeningSkill,
    focusContrastId,
    retiredBlankKeys,
    currentExerciseLevel,
    audioDistractorPool,
    stats,
    counts,
    sessionProgress,
    sessionPreview,
    isResume,
    previewLoading,
    studyContext,
    sessionSummary,
    strugglingWords,
    reloadLoading,
    levels,
    setLevels,
    pos,
    activeRouteId,
    setRoute,
    startSpeak,
    beginSession,
    omitWord,
    submitGrade,
    reload,
    learnMore,
    archiveWord,
    keepSnooze,
    masterWord,
    sessionSize,
    setSessionSize,
    discardSession,
    pauseAndPersistSession,
    startLeechReview,
  };
}
