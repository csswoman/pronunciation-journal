"use client";

import { useRef, useCallback } from "react";
import type { ErrorPatternId } from "@/lib/exercises/error-patterns";
import type { ToolCall } from "@/lib/ai-practice/types";
import {
  extractTurnCorrection,
  pickCorrectionToRecord,
} from "@/lib/ai-practice/correction";
import { recordPracticeErrorRecurrence } from "@/lib/practice/error-recurrence-sync";

/**
 * Registers one error-recurrence entry per errorPattern per conversation.
 *
 * - Only fires for live turns (caller must not call recordIfNeeded for
 *   loadMessages or hidden/automated turns).
 * - Deduplicates within the session: the same pattern is only queued once even
 *   if the learner repeats the error multiple times.
 * - Call reset() when the conversation is reset so the set clears.
 */
export function useCoachErrorRecurrence() {
  const recordedRef = useRef<Set<ErrorPatternId>>(new Set());

  const recordIfNeeded = useCallback(
    (userId: string, toolCalls: Map<string, ToolCall>) => {
      const correction = extractTurnCorrection(toolCalls);
      const pattern = pickCorrectionToRecord(correction, recordedRef.current);
      if (!pattern) return;
      recordedRef.current.add(pattern);
      void recordPracticeErrorRecurrence(userId, pattern, undefined, false).catch(() => {});
    },
    [],
  );

  const reset = useCallback(() => {
    recordedRef.current = new Set();
  }, []);

  return { recordIfNeeded, reset };
}
