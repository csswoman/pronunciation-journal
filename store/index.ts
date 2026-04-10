/**
 * store/index.ts — barrel for the state management layer.
 *
 * Import from here in components:
 *   import { useJournalStore, useLiveAttempts } from "@/store";
 */

// Zustand — UI / volatile state
export {
  useJournalStore,
  useRecordingPhase,
  useCurrentPhoneme,
  useAIDialog,
  useLastAttemptAccuracy,
} from "./useJournalStore";
export type { AttemptPayload, RecordingPhase, AIDialogState } from "./useJournalStore";

// Dexie live queries — reactive data layer
export {
  useLiveAttempts,
  useLiveAttemptsForWord,
  useLiveAttemptsForLesson,
  useLiveTodayProgress,
  useLiveProgressHistory,
  useLiveConversations,
  useLiveConversation,
  useLiveAIWords,
  useLiveAIWordsForConversation,
  useLiveDueWords,
} from "./useLiveData";
