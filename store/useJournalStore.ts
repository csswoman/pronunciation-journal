/**
 * useJournalStore — Zustand store for volatile UI state.
 *
 * Rule: only ephemeral UI state lives here (recording phase, dialogs, current
 * phoneme). Persistent data (attempts, conversations, SRS) lives in Dexie and
 * is observed via useLiveQuery in the companion hooks.
 *
 * Server Action compatibility: actions that need to reach Supabase accept an
 * optional `serverAction` callback so callers can pass a Next.js Server Action
 * without coupling this store to any server-only import.
 */

import { create } from "zustand";
import { saveAttempt, updateDailyProgress, updateUserStats } from "@/lib/db";
import type { ScoringResult } from "@/lib/types";

// ── Types ────────────────────────────────────────────────────────────────────

export type RecordingPhase = "idle" | "recording" | "processing" | "done";

export type AIDialogState =
  | { open: false }
  | { open: true; word: string; context: string };

interface JournalState {
  // Recording
  recordingPhase: RecordingPhase;
  currentPhoneme: string | null;

  // Active lesson session
  currentLessonId: string | null;

  // AI save-word dialog
  aiDialog: AIDialogState;

  // Optimistic last-attempt result (avoids re-reading Dexie for UI flash)
  lastAttemptAccuracy: number | null;
}

interface JournalActions {
  // Recording lifecycle
  setRecordingPhase: (phase: RecordingPhase) => void;
  setCurrentPhoneme: (phoneme: string | null) => void;

  // Lesson
  startLessonSession: (lessonId: string) => void;
  endLessonSession: () => void;

  // AI dialog
  openAIDialog: (word: string, context: string) => void;
  closeAIDialog: () => void;

  /**
   * finishAttempt — the core write action.
   *
   * 1. Writes to Dexie (attempts + dailyProgress + userStats).
   * 2. Optionally calls a Server Action for Supabase persistence.
   *    Pass `serverAction` as an async fn when you need cloud sync; omit it for
   *    pure offline use.
   *
   * useLiveQuery subscribers update automatically after the Dexie write.
   */
  finishAttempt: (
    word: string,
    result: ScoringResult,
    xpEarned: number,
    options?: {
      serverAction?: (payload: AttemptPayload) => Promise<void>;
    }
  ) => Promise<void>;

  reset: () => void;
}

export interface AttemptPayload {
  word: string;
  lessonId: string;
  accuracy: number;
  transcript: string;
  timestamp: string;
}

// ── Initial state ─────────────────────────────────────────────────────────────

const initialState: JournalState = {
  recordingPhase: "idle",
  currentPhoneme: null,
  currentLessonId: null,
  aiDialog: { open: false },
  lastAttemptAccuracy: null,
};

// ── Store ─────────────────────────────────────────────────────────────────────

export const useJournalStore = create<JournalState & JournalActions>()((set, get) => ({
  ...initialState,

  setRecordingPhase: (phase) => set({ recordingPhase: phase }),

  setCurrentPhoneme: (phoneme) => set({ currentPhoneme: phoneme }),

  startLessonSession: (lessonId) =>
    set({ currentLessonId: lessonId, recordingPhase: "idle", lastAttemptAccuracy: null }),

  endLessonSession: () =>
    set({ currentLessonId: null, recordingPhase: "idle", lastAttemptAccuracy: null }),

  openAIDialog: (word, context) =>
    set({ aiDialog: { open: true, word, context } }),

  closeAIDialog: () => set({ aiDialog: { open: false } }),

  finishAttempt: async (word, result, xpEarned, options) => {
    const { currentLessonId } = get();
    const lessonId = currentLessonId ?? "unknown";
    const timestamp = new Date().toISOString();

    // 1. Optimistic UI update (instant)
    set({ recordingPhase: "done", lastAttemptAccuracy: result.accuracy });

    // 2. Dexie writes (triggers useLiveQuery re-renders automatically)
    await saveAttempt({
      word: word.toLowerCase(),
      lessonId,
      accuracy: result.accuracy,
      transcript: result.transcript,
      isCorrect: result.isCorrect,
      timestamp,
    });
    await updateDailyProgress(result.accuracy, word, xpEarned);
    await updateUserStats(result.accuracy, xpEarned);

    // 3. Optional Supabase sync via Server Action (fire-and-forget, non-blocking)
    if (options?.serverAction) {
      const payload: AttemptPayload = {
        word: word.toLowerCase(),
        lessonId,
        accuracy: result.accuracy,
        transcript: result.transcript,
        timestamp,
      };
      options.serverAction(payload).catch((err) => {
        // Log but don't surface — offline-first; Supabase is best-effort
        console.warn("[finishAttempt] Server action failed:", err);
      });
    }
  },

  reset: () => set(initialState),
}));

// ── Selector hooks (avoids unnecessary re-renders) ────────────────────────────

export const useRecordingPhase = () =>
  useJournalStore((s) => s.recordingPhase);

export const useCurrentPhoneme = () =>
  useJournalStore((s) => s.currentPhoneme);

export const useAIDialog = () =>
  useJournalStore((s) => s.aiDialog);

export const useLastAttemptAccuracy = () =>
  useJournalStore((s) => s.lastAttemptAccuracy);
