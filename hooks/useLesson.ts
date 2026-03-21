"use client";

import { useState, useCallback } from "react";
import type { Lesson, LessonWord, ScoringResult } from "@/lib/types";

export interface WordAttempt {
  word: string;
  attempts: number[]; // accuracy per attempt, in order
  best: number;       // highest accuracy across attempts
}

interface UseLessonReturn {
  lesson: Lesson | null;
  currentWord: LessonWord | null;
  currentIndex: number;
  totalWords: number;
  wordAttempts: WordAttempt[];
  sessionAccuracy: number;
  totalXP: number;
  startLesson: (lesson: Lesson) => void;
  addResult: (result: ScoringResult, xp: number, word: string) => void;
  nextWord: () => void;
  retryWord: () => void;
  resetLesson: () => void;
}

export function useLesson(): UseLessonReturn {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [wordAttempts, setWordAttempts] = useState<WordAttempt[]>([]);
  const [totalXP, setTotalXP] = useState(0);

  const currentWord = lesson?.words[currentIndex] ?? null;
  const totalWords = lesson?.words.length ?? 0;

  // Session accuracy = average of each word's best score
  const sessionAccuracy =
    wordAttempts.length > 0
      ? Math.round(wordAttempts.reduce((sum, w) => sum + w.best, 0) / wordAttempts.length)
      : 0;

  const startLesson = useCallback((l: Lesson) => {
    setLesson(l);
    setCurrentIndex(0);
    setWordAttempts([]);
    setTotalXP(0);
  }, []);

  const addResult = useCallback((result: ScoringResult, xp: number, word: string) => {
    setWordAttempts((prev) => {
      const idx = prev.findIndex((w) => w.word === word);
      if (idx === -1) {
        return [...prev, { word, attempts: [result.accuracy], best: result.accuracy }];
      }
      const existing = prev[idx];
      const updated: WordAttempt = {
        word,
        attempts: [...existing.attempts, result.accuracy],
        best: Math.max(existing.best, result.accuracy),
      };
      const next = [...prev];
      next[idx] = updated;
      return next;
    });
    setTotalXP((prev) => prev + xp);
  }, []);

  const nextWord = useCallback(() => {
    setCurrentIndex((prev) => prev + 1);
  }, []);

  const retryWord = useCallback(() => {
    // no-op: page manages phase, wordAttempts keeps accumulating
  }, []);

  const resetLesson = useCallback(() => {
    setLesson(null);
    setCurrentIndex(0);
    setWordAttempts([]);
    setTotalXP(0);
  }, []);

  return {
    lesson,
    currentWord,
    currentIndex,
    totalWords,
    wordAttempts,
    sessionAccuracy,
    totalXP,
    startLesson,
    addResult,
    nextWord,
    retryWord,
    resetLesson,
  };
}
