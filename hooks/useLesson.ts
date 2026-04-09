"use client";

import { useState, useCallback } from "react";
import type { Lesson, LessonWord, ScoringResult } from "@/lib/types";

export interface WordAttempt {
  word: string;
  attempts: number[]; // accuracy per attempt, in order
  best: number;       // highest accuracy across attempts
  skipped?: boolean;
  known?: boolean;
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
  skipWord: (word: string) => void;
  markKnown: (word: string, index: number) => void;
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
  // Session accuracy only counts attempted words (not skipped/known)
  const attempted = wordAttempts.filter((w) => !w.skipped && !w.known);
  const sessionAccuracy =
    attempted.length > 0
      ? Math.round(attempted.reduce((sum, w) => sum + w.best, 0) / attempted.length)
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

  const skipWord = useCallback((word: string) => {
    setWordAttempts((prev) => {
      if (prev.find((w) => w.word === word)) return prev;
      return [...prev, { word, attempts: [], best: 0, skipped: true }];
    });
    setCurrentIndex((ci) => ci + 1);
  }, []);

  const markKnown = useCallback((word: string, index: number) => {
    setWordAttempts((prev) => {
      if (prev.find((w) => w.word === word)) return prev;
      return [...prev, { word, attempts: [], best: 100, known: true }];
    });
    setLesson((prev) => {
      if (!prev) return prev;
      return { ...prev, words: prev.words.filter((_, i) => i !== index) };
    });
    // index stays the same — next word slides in
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
    skipWord,
    markKnown,
    retryWord,
    resetLesson,
  };
}
