import type { WordProgressSignal } from '@/lib/word-bank/progress-state';

export type TrackedKind = "word" | "phrase" | "lesson" | "explanation";
export type PersistedTrackedKind = Exclude<TrackedKind, "word">;

export interface TrackedItem {
  id: string;
  userId: string;
  kind: PersistedTrackedKind;
  ref: string;
  title: string | null;
  payload: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Guardadas filters. Every filter except "ai_coach" narrows by item kind
 * (word, phrase, lesson, explanation); "ai_coach" narrows by origin instead,
 * so it cuts across all kinds.
 */
export type TrackingFilter = "all" | TrackedKind | "ai_coach";

export interface TrackingItem {
  id: string;
  kind: TrackedKind;
  title: string;
  description?: string | null;
  href?: string;
  progressState?: WordProgressSignal;
  progressLabel?: string;
  /** True when the AI Coach saved this item. */
  fromCoach?: boolean;
}
