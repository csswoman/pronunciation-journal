"use client";

import { useState, useCallback } from "react";
import type { Lesson, LessonWord, ScoringResult } from "@/lib/types";

interface UseLessonReturn {
  lesson: Lesson | null;
  currentWord: LessonWord | null;
  currentIndex: number;
  totalWords: number;
  results: ScoringResult[];
  sessionAccuracy: number;
  totalXP: number;
  startLesson: (lesson: Lesson) => void;
  addResult: (result: ScoringResult, xp: number) => void;
  nextWord: () => void;
  retryWord: () => void;
  resetLesson: () => void;
}

export function useLesson(): UseLessonReturn {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<ScoringResult[]>([]);
  const [totalXP, setTotalXP] = useState(0);

  const currentWord = lesson?.words[currentIndex] ?? null;
  const totalWords = lesson?.words.length ?? 0;

  const sessionAccuracy =
    results.length > 0
      ? Math.round(results.reduce((sum, r) => sum + r.accuracy, 0) / results.length)
      : 0;

  const startLesson = useCallback((l: Lesson) => {
    setLesson(l);
    setCurrentIndex(0);
    setResults([]);
    setTotalXP(0);
  }, []);

  // addResult just stores the result — phase is managed by the page
  const addResult = useCallback((result: ScoringResult, xp: number) => {
    setResults((prev) => [...prev, result]);
    setTotalXP((prev) => prev + xp);
  }, []);

  const nextWord = useCallback(() => {
    setCurrentIndex((prev) => prev + 1);
  }, []);

  const retryWord = useCallback(() => {
    // no-op: state stays the same, page resets its own phase
  }, []);

  const resetLesson = useCallback(() => {
    setLesson(null);
    setCurrentIndex(0);
    setResults([]);
    setTotalXP(0);
  }, []);

  return {
    lesson,
    currentWord,
    currentIndex,
    totalWords,
    results,
    sessionAccuracy,
    totalXP,
    startLesson,
    addResult,
    nextWord,
    retryWord,
    resetLesson,
  };
}
