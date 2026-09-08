"use client";

import { useCallback, useMemo, useRef } from "react";
import type { ExerciseResult } from "@/lib/ai-practice/types";
import { logEvent } from "@/lib/ai-practice/events";
import { recordCoachSession, type CoachSessionExercise } from "@/lib/ai-practice/coach-progress";
import { logFirstExerciseTimeIfNeeded } from "@/lib/ai-practice/chat-helpers";
import type { AIConversationMode } from "@/lib/types";

export interface UseCoachSessionMetricsOptions {
  mode: AIConversationMode;
  userId: string | null;
}

export interface UseCoachSessionMetricsReturn {
  /** Idempotent: only the first call of a session emits `session_started`. */
  markSessionStarted: (conversationId: number | null) => void;
  recordExercise: (toolName: string, result: ExerciseResult) => void;
  noteFirstExercise: (calls: Map<string, { name: string }>) => Promise<void>;
  /** Flushes completed exercises to progress storage. Safe to call twice. */
  finalizeSession: () => void;
  /** Emits `session_ended` with totals, then clears counters. */
  endSession: () => void;
}

/**
 * Session-level telemetry and progress accounting for the coach, split out of
 * `useStreamingChat` so the transport hook is not also a metrics bucket.
 * All counters live in refs: they never drive rendering.
 */
export function useCoachSessionMetrics({
  mode,
  userId,
}: UseCoachSessionMetricsOptions): UseCoachSessionMetricsReturn {
  const startedRef = useRef(false);
  const startAtRef = useRef(0);
  const completedRef = useRef(0);
  const correctRef = useRef(0);
  const firstExerciseLoggedRef = useRef(false);
  const exercisesRef = useRef<CoachSessionExercise[]>([]);
  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  const markSessionStarted = useCallback(
    (conversationId: number | null) => {
      if (startedRef.current) return;
      startedRef.current = true;
      startAtRef.current = Date.now();
      logEvent("session_started", { mode, conversationId: conversationId ?? undefined }, userId).catch(() => {});
    },
    [mode, userId],
  );

  const recordExercise = useCallback((toolName: string, result: ExerciseResult) => {
    completedRef.current += 1;
    if (result.correct) correctRef.current += 1;
    exercisesRef.current.push({ toolName, result });
  }, []);

  const noteFirstExercise = useCallback(
    async (calls: Map<string, { name: string }>) => {
      firstExerciseLoggedRef.current = await logFirstExerciseTimeIfNeeded(
        firstExerciseLoggedRef.current,
        calls,
        startAtRef.current,
        userIdRef.current,
      );
    },
    [],
  );

  const finalizeSession = useCallback(() => {
    const completedExercises = exercisesRef.current;
    exercisesRef.current = [];
    const activeUserId = userIdRef.current;
    if (activeUserId && completedExercises.length > 0) {
      void recordCoachSession(activeUserId, completedExercises).catch((err) => {
        console.error("[AI Coach] session progress save failed", err);
      });
    }
  }, []);

  const endSession = useCallback(() => {
    if (!startedRef.current) return;
    const completed = completedRef.current;
    logEvent("session_ended", {
      mode,
      exercisesCompleted: completed,
      correctRate: completed > 0 ? correctRef.current / completed : 0,
      durationMs: Date.now() - startAtRef.current,
    }, userId).catch(() => {});
    startedRef.current = false;
    completedRef.current = 0;
    correctRef.current = 0;
    firstExerciseLoggedRef.current = false;
  }, [mode, userId]);

  // Memoized: consumers list this object in `useCallback` deps, so a fresh
  // identity each render would rebuild `sendMessage` on every keystroke.
  return useMemo(
    () => ({ markSessionStarted, recordExercise, noteFirstExercise, finalizeSession, endSession }),
    [markSessionStarted, recordExercise, noteFirstExercise, finalizeSession, endSession],
  );
}
