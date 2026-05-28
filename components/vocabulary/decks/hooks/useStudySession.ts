"use client";

import { useEffect, useState, useCallback } from "react";
import { RATING_CONFIG } from "../study-utils";
import type { DifficultyKey } from "../StudyDifficultyButtons";
import type { StudySource, StudyCardData, SM2Progress } from "@/lib/decks/study-source";

export interface SessionStats {
  seen: number;
  again: number;
  hard: number;
  easy: number;
  newlyMastered: number;
}

const EMPTY_STATS: SessionStats = { seen: 0, again: 0, hard: 0, easy: 0, newlyMastered: 0 };

// previewInterval expects deck_entry_progress shape — we satisfy it structurally
export function toProgressCompat(p: SM2Progress | null) {
  if (!p) return null;
  return {
    ease_factor: p.ease_factor,
    interval_days: p.interval_days,
    repetitions: p.repetitions,
    next_review_at: p.next_review_at ?? new Date().toISOString(),
    status: p.status as "new" | "learning" | "review" | "mastered",
    last_reviewed_at: p.last_reviewed_at,
    id: "", user_id: "", entry_id: "", created_at: "", updated_at: "",
  };
}

export type StudyPhase = "loading" | "studying" | "done";

export interface UseStudySessionReturn {
  phase: StudyPhase;
  queue: StudyCardData[];
  currentIndex: number;
  currentCard: StudyCardData | undefined;
  flipped: boolean;
  stats: SessionStats;
  progress: number;
  setFlipped: (v: boolean | ((prev: boolean) => boolean)) => void;
  handleRate: (difficulty: DifficultyKey) => Promise<void>;
  advanceCard: () => void;
  resetSession: () => void;
}

export function useStudySession(source: StudySource): UseStudySessionReturn {
  const [phase, setPhase] = useState<StudyPhase>("loading");
  const [queue, setQueue] = useState<StudyCardData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [stats, setStats] = useState<SessionStats>(EMPTY_STATS);

  useEffect(() => {
    source.loadCards().then(cards => {
      setQueue(cards);
      setPhase("studying");
    }).catch(err => {
      console.error("[useStudySession] load error:", err);
      setPhase("studying");
    });
  }, [source]);

  const currentCard = queue[currentIndex];

  const advanceCard = useCallback(() => {
    if (currentIndex + 1 >= queue.length) {
      setPhase("done");
    } else {
      setCurrentIndex(p => p + 1);
      setFlipped(false);
    }
  }, [currentIndex, queue.length]);

  const handleRate = useCallback(async (difficulty: DifficultyKey) => {
    if (!currentCard) return;
    const q = RATING_CONFIG[difficulty].q;
    const next = await source.saveProgress(currentCard.id, q, currentCard.progress);
    setQueue(prev => prev.map(c => c.id === currentCard.id ? { ...c, progress: next } : c));
    setStats(s => ({
      seen: s.seen + 1,
      again: difficulty === "again" ? s.again + 1 : s.again,
      hard: difficulty === "hard" ? s.hard + 1 : s.hard,
      easy: difficulty === "easy" ? s.easy + 1 : s.easy,
      newlyMastered: next.status === "mastered" ? s.newlyMastered + 1 : s.newlyMastered,
    }));
    advanceCard();
  }, [currentCard, source, advanceCard]);

  const resetSession = useCallback(() => {
    setCurrentIndex(0);
    setFlipped(false);
    setStats(EMPTY_STATS);
    setPhase("studying");
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (phase !== "studying") return;
      if (e.code === "Space") { e.preventDefault(); setFlipped(f => !f); }
      if (flipped) {
        if (e.key === "1") void handleRate("again");
        if (e.key === "2") void handleRate("hard");
        if (e.key === "3") void handleRate("easy");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [phase, flipped, handleRate]);

  const progress = queue.length > 0 ? (currentIndex / queue.length) * 100 : 0;

  return {
    phase, queue, currentIndex, currentCard, flipped, stats, progress,
    setFlipped, handleRate, advanceCard, resetSession,
  };
}
