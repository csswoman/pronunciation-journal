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

export interface TrackingItem {
  id: string;
  kind: TrackedKind;
  title: string;
  description?: string | null;
  href?: string;
}
