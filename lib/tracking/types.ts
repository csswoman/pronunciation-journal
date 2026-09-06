import type { WordProgressSignal } from '@/lib/word-bank/progress-state';

export type TrackedKind = "word" | "phrase" | "lesson";
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
 * Guardadas filters. The first four narrow by item kind; "ai_coach" narrows by
 * origin instead, so it cuts across all three kinds.
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
