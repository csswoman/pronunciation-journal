/**
 * useLiveData — Dexie useLiveQuery bindings for React 19.
 *
 * These hooks subscribe to IndexedDB tables and re-render automatically
 * whenever the underlying data changes — including after a Zustand action
 * calls saveAttempt(), updateDailyProgress(), etc.
 *
 * Pattern:
 *   Zustand action writes to Dexie  →  Dexie notifies subscribers
 *   →  useLiveQuery triggers re-render  →  component sees fresh data
 *
 * Keep these hooks thin: no business logic, only queries.
 * Place derived state / selectors in the calling component or a selector hook.
 */

"use client";

import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { getRelativeLocalDateKey, getTodayLocalDateKey } from "@/lib/date/local-date";
import type { AIConversation, AISavedWord, Attempt, DailyProgress } from "@/lib/types";

function useClockTick(intervalMs = 60_000): number {
  const [tick, setTick] = useState(() => Date.now());

  useEffect(() => {
    const intervalId = window.setInterval(() => setTick(Date.now()), intervalMs);
    return () => window.clearInterval(intervalId);
  }, [intervalMs]);

  return tick;
}

// ── Attempts ──────────────────────────────────────────────────────────────────

/** Last N pronunciation attempts, newest first. */
export function useLiveAttempts(limit = 50): Attempt[] {
  return (
    useLiveQuery(
      () => db.attempts.orderBy("timestamp").reverse().limit(limit).toArray(),
      [limit]
    ) ?? []
  );
}

/** All attempts for a specific word (case-insensitive). */
export function useLiveAttemptsForWord(word: string): Attempt[] {
  return (
    useLiveQuery(
      () => db.attempts.where("word").equals(word.toLowerCase()).toArray(),
      [word]
    ) ?? []
  );
}

/** All attempts for a lesson session. */
export function useLiveAttemptsForLesson(lessonId: string): Attempt[] {
  return (
    useLiveQuery(
      () => db.attempts.where("lessonId").equals(lessonId).toArray(),
      [lessonId]
    ) ?? []
  );
}

// ── Daily Progress ────────────────────────────────────────────────────────────

/** Today's progress record (undefined while loading). */
export function useLiveTodayProgress(): DailyProgress | undefined {
  const tick = useClockTick();
  const today = getTodayLocalDateKey();
  return useLiveQuery(
    () => db.dailyProgress.where("date").equals(today).first(),
    [today, tick]
  );
}

/** Progress for the last N days, newest first. */
export function useLiveProgressHistory(days = 7): DailyProgress[] {
  const tick = useClockTick();
  const since = getRelativeLocalDateKey(-days + 1);
  return (
    useLiveQuery(
      () =>
        db.dailyProgress
          .where("date")
          .aboveOrEqual(since)
          .reverse()
          .toArray(),
      [since, tick]
    ) ?? []
  );
}

// ── AI Conversations ──────────────────────────────────────────────────────────

/** Recent AI conversations, newest first. */
export function useLiveConversations(limit = 20): AIConversation[] {
  return (
    useLiveQuery(
      () =>
        db.aiConversations
          .orderBy("updatedAt")
          .reverse()
          .limit(limit)
          .toArray(),
      [limit]
    ) ?? []
  );
}

/** A single AI conversation by id (undefined while loading or not found). */
export function useLiveConversation(id: number | null): AIConversation | undefined {
  return useLiveQuery<AIConversation | undefined>(
    () => (id != null ? db.aiConversations.get(id) : Promise.resolve(undefined)),
    [id]
  );
}

// ── AI Saved Words ────────────────────────────────────────────────────────────

/** All words saved from AI practice sessions, newest first. */
export function useLiveAIWords(limit = 100): AISavedWord[] {
  return (
    useLiveQuery(
      () => db.aiWords.orderBy("savedAt").reverse().limit(limit).toArray(),
      [limit]
    ) ?? []
  );
}

/** Words saved from a specific conversation. */
export function useLiveAIWordsForConversation(conversationId: number | null): AISavedWord[] {
  return (
    useLiveQuery<AISavedWord[]>(
      () =>
        conversationId != null
          ? db.aiWords.where("conversationId").equals(conversationId).toArray()
          : Promise.resolve([] as AISavedWord[]),
      [conversationId]
    ) ?? []
  );
}

// ── SRS ───────────────────────────────────────────────────────────────────────

/** Words due for review right now. */
export function useLiveDueWords() {
  const tick = useClockTick();
  const now = new Date().toISOString();
  return (
    useLiveQuery(
      () => db.srsData.where("nextReview").belowOrEqual(now).toArray(),
      [now, tick]
    ) ?? []
  );
}
