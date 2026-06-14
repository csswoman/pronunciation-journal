"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchCoreWords } from "@/lib/core-1000/client";
import { buildSessionQueue, type Core1000QueueItem } from "@/lib/core-1000/queue";
import { gradeCore1000Word, type GradeExtras } from "@/lib/core-1000/grade";
import { NEW_CARDS_PER_DAY } from "@/lib/core-1000/types";
import {
  getCore1000SrsEntries, getCore1000IntroducedToday, recordCore1000Introduction,
} from "@/lib/db";
import { useAuth } from "@/components/auth/AuthProvider";

export type Core1000Phase = "loading" | "study" | "speak" | "done" | "empty";

export interface Core1000Stats {
  totalWords: number;   // tamaño del dataset disponible
  learned: number;      // entradas SRS existentes
  dueCount: number;     // vencidas en esta sesión
  newToday: number;     // nuevas ya introducidas hoy
  newQuota: number;     // cupo diario
}

interface UseCore1000SessionReturn {
  phase: Core1000Phase;
  current: Core1000QueueItem | null;
  position: number;       // 1-based dentro de la cola
  queueLength: number;
  stats: Core1000Stats;
  startSpeak: () => void; // study → speak (tarjetas nuevas)
  submitGrade: (quality: number, extras?: GradeExtras) => Promise<void>;
}

const EMPTY_STATS: Core1000Stats = {
  totalWords: 0, learned: 0, dueCount: 0, newToday: 0, newQuota: NEW_CARDS_PER_DAY,
};

export function useCore1000Session(): UseCore1000SessionReturn {
  const { user } = useAuth();
  const [phase, setPhase] = useState<Core1000Phase>("loading");
  const [queue, setQueue] = useState<Core1000QueueItem[]>([]);
  const [index, setIndex] = useState(0);
  const [stats, setStats] = useState<Core1000Stats>(EMPTY_STATS);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [words, srsEntries, introducedToday] = await Promise.all([
        fetchCoreWords(),
        getCore1000SrsEntries(),
        getCore1000IntroducedToday(),
      ]);
      if (cancelled) return;
      const items = buildSessionQueue({ words, srsEntries, introducedToday, now: new Date() });
      setQueue(items);
      setStats({
        totalWords: words.length,
        learned: srsEntries.length,
        dueCount: items.filter((i) => !i.isNew).length,
        newToday: introducedToday.length,
        newQuota: NEW_CARDS_PER_DAY,
      });
      if (items.length === 0) setPhase("empty");
      else setPhase(items[0].isNew ? "study" : "speak");
    })();
    return () => { cancelled = true; };
  }, []);

  const advance = useCallback((from: number) => {
    const next = from + 1;
    if (next >= queue.length) {
      setPhase("done");
      return;
    }
    setIndex(next);
    setPhase(queue[next].isNew ? "study" : "speak");
  }, [queue]);

  const startSpeak = useCallback(() => setPhase("speak"), []);

  const submitGrade = useCallback(
    async (quality: number, extras?: GradeExtras) => {
      const item = queue[index];
      if (!item) return;
      await gradeCore1000Word(item.entry.word, quality, extras, user?.id);
      if (item.isNew) {
        await recordCore1000Introduction(item.entry.word.toLowerCase());
        setStats((s) => ({ ...s, newToday: s.newToday + 1, learned: s.learned + 1 }));
      }
      advance(index);
    },
    [queue, index, advance]
  );

  return {
    phase,
    current: queue[index] ?? null,
    position: Math.min(index + 1, queue.length),
    queueLength: queue.length,
    stats,
    startSpeak,
    submitGrade,
  };
}
