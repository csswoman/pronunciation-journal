"use client";

import { useRef, useCallback } from "react";
import type { ErrorPatternId } from "@/lib/exercises/error-patterns";
import type { AIMessage, CoachErrorRecurrenceFeedback, ToolCall } from "@/lib/ai-practice/types";
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
 * - Deduplicates a pattern for the full conversation, including corrections
 *   restored from persisted conversation history.
 * - Failed local writes are not retained in the set, so a later turn can retry.
 */
export function useCoachErrorRecurrence() {
  const recordedRef = useRef<Set<ErrorPatternId>>(new Set());

  const recordIfNeeded = useCallback(
    async (
      userId: string | null,
      toolCalls: Map<string, ToolCall>,
      hidden = false,
    ): Promise<CoachErrorRecurrenceFeedback | null> => {
      if (!userId || hidden) return null;
      const correction = extractTurnCorrection(toolCalls);
      const pattern = pickCorrectionToRecord(correction, recordedRef.current);
      if (!pattern) {
        if (correction?.kind === "error" && correction.errorPattern && recordedRef.current.has(correction.errorPattern)) {
          return { patternId: correction.errorPattern, status: "saved" };
        }
        return null;
      }

      recordedRef.current.add(pattern);
      let saved = false;
      try {
        saved = await recordPracticeErrorRecurrence(userId, pattern, undefined, false);
      } catch {
        saved = false;
      }
      if (!saved) recordedRef.current.delete(pattern);
      return { patternId: pattern, status: saved ? "saved" : "failed" };
    },
    [],
  );

  const restoreFromMessages = useCallback((messages: AIMessage[]) => {
    const recorded = new Set<ErrorPatternId>();
    let lastUserWasHidden = false;

    for (const message of messages) {
      if (message.role === "user") {
        lastUserWasHidden = Boolean(message.hidden);
        continue;
      }
      if (message.role !== "model" || lastUserWasHidden) continue;

      const correction = extractTurnCorrection(message.toolCalls);
      if (correction?.kind !== "error" || !correction.errorPattern) continue;

      if (message.errorRecurrence) {
        if (message.errorRecurrence.patternId === correction.errorPattern && message.errorRecurrence.status === "saved") {
          recorded.add(correction.errorPattern);
        }
        continue;
      }

      // Older persisted turns predate explicit save status. Treat their visible
      // correction as already recorded to avoid incrementing the queue again.
      recorded.add(correction.errorPattern);
    }

    recordedRef.current = recorded;
  }, []);

  const reset = useCallback(() => {
    recordedRef.current = new Set();
  }, []);

  return { recordIfNeeded, reset, restoreFromMessages };
}
