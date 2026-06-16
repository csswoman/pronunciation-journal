"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchCoreWords } from "@/lib/core-1000/client";
import { buildSessionQueue, type Core1000QueueItem } from "@/lib/core-1000/queue";
import { gradeCore1000Word, type GradeExtras } from "@/lib/core-1000/grade";
import { core1000WordId } from "@/lib/core-1000/types";
import { NEW_CARDS_PER_DAY } from "@/lib/core-1000/types";
import {
  getCore1000SrsEntries, getCore1000IntroducedToday, recordCore1000Introduction,
} from "@/lib/db";
import { useAuth } from "@/components/auth/AuthProvider";
import { recordActivitySession } from "@/lib/progress/activity-hub";
import { buildSessionResult } from "@/lib/practice/session-result";
import type { ExerciseResult } from "@/lib/practice/types";

export type Core1000Phase = "loading" | "study" | "speak" | "done" | "empty";

export interface Core1000Stats {
  totalWords: number;   // tamaño del dataset disponible
  learned: number;      // entradas SRS existentes
  dueCount: number;     // vencidas en esta sesión
  newToday: number;     // nuevas ya introducidas hoy
  newQuota: number;     // cupo diario
}

export interface Core1000SessionSummary {
  practiced: number;
  correct: number;
}

interface UseCore1000SessionReturn {
  phase: Core1000Phase;
  current: Core1000QueueItem | null;
  position: number;       // 1-based dentro de la cola
  queueLength: number;
  stats: Core1000Stats;
  sessionSummary: Core1000SessionSummary | null;
  reloadLoading: boolean;
  startSpeak: () => void; // study → speak (tarjetas nuevas)
  submitGrade: (quality: number, extras?: GradeExtras) => Promise<void>;
  reload: () => Promise<void>;
}

const EMPTY_STATS: Core1000Stats = {
  totalWords: 0, learned: 0, dueCount: 0, newToday: 0, newQuota: NEW_CARDS_PER_DAY,
};

async function loadQueue(): Promise<{
  items: Core1000QueueItem[];
  stats: Core1000Stats;
  initialPhase: Core1000Phase;
}> {
  const [words, srsEntries, introducedToday] = await Promise.all([
    fetchCoreWords(),
    getCore1000SrsEntries(),
    getCore1000IntroducedToday(),
  ]);

  const items = buildSessionQueue({ words, srsEntries, introducedToday, now: new Date() });
  const stats: Core1000Stats = {
    totalWords: words.length,
    learned: srsEntries.length,
    dueCount: items.filter((i) => !i.isNew).length,
    newToday: introducedToday.length,
    newQuota: NEW_CARDS_PER_DAY,
  };

  if (items.length === 0) {
    return { items, stats, initialPhase: "empty" };
  }

  return {
    items,
    stats,
    initialPhase: items[0].isNew ? "study" : "speak",
  };
}

export function useCore1000Session(): UseCore1000SessionReturn {
  const { user } = useAuth();
  const [phase, setPhase] = useState<Core1000Phase>("loading");
  const [queue, setQueue] = useState<Core1000QueueItem[]>([]);
  const [index, setIndex] = useState(0);
  const [stats, setStats] = useState<Core1000Stats>(EMPTY_STATS);
  const [sessionSummary, setSessionSummary] = useState<Core1000SessionSummary | null>(null);
  const [reloadLoading, setReloadLoading] = useState(false);
  const sessionResultsRef = useRef<ExerciseResult[]>([]);

  const bootstrap = useCallback(async () => {
    const { items, stats: nextStats, initialPhase } = await loadQueue();
    setQueue(items);
    setStats(nextStats);
    setIndex(0);
    setSessionSummary(null);
    sessionResultsRef.current = [];
    setPhase(initialPhase);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { items, stats: nextStats, initialPhase } = await loadQueue();
        if (cancelled) return;
        setQueue(items);
        setStats(nextStats);
        setPhase(initialPhase);
      } catch {
        if (!cancelled) setPhase("empty");
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const finishSession = useCallback(() => {
    setPhase("done");
    if (!user?.id) return;

    const sessionResult = buildSessionResult(sessionResultsRef.current);
    void recordActivitySession(user.id, {
      practiceContext: "core-1000",
      sessionResult,
    })
      .then(() => import("@/lib/sync/sync-manager").then(({ flushOutbox }) => flushOutbox()))
      .catch((err) => {
        console.error("[Core1000Session] recordActivitySession failed", err);
      });
  }, [user?.id]);

  const advance = useCallback((from: number) => {
    const next = from + 1;
    if (next >= queue.length) {
      finishSession();
      return;
    }
    setIndex(next);
    setPhase(queue[next].isNew ? "study" : "speak");
  }, [queue, finishSession]);

  const startSpeak = useCallback(() => setPhase("speak"), []);

  const submitGrade = useCallback(
    async (quality: number, extras?: GradeExtras) => {
      const item = queue[index];
      if (!item) return;
      await gradeCore1000Word(item.entry.word, quality, extras, user?.id);
      const wordId = core1000WordId(item.entry.word.toLowerCase());
      sessionResultsRef.current.push({
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
      });
      setSessionSummary((prev) => ({
        practiced: (prev?.practiced ?? 0) + 1,
        correct: (prev?.correct ?? 0) + (quality >= 3 ? 1 : 0),
      }));
      if (item.isNew) {
        await recordCore1000Introduction(item.entry.word.toLowerCase());
        setStats((s) => ({ ...s, newToday: s.newToday + 1, learned: s.learned + 1 }));
      }
      advance(index);
    },
    [queue, index, advance, user?.id],
  );

  const reload = useCallback(async () => {
    setReloadLoading(true);
    try {
      await bootstrap();
    } finally {
      setReloadLoading(false);
    }
  }, [bootstrap]);

  return {
    phase,
    current: queue[index] ?? null,
    position: Math.min(index + 1, queue.length),
    queueLength: queue.length,
    stats,
    sessionSummary,
    reloadLoading,
    startSpeak,
    submitGrade,
    reload,
  };
}
