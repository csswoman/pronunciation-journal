"use client";

import { db } from "@/lib/db";
import { enqueue, flushOutbox } from "@/lib/sync/sync-manager";
import type { UserLearningState } from "./learning-state";

/**
 * Persist UserLearningState:
 *  1. Write to Dexie immediately (offline-first).
 *  2. Enqueue an upsert to `user_learning_state` in Supabase.
 *  3. Opportunistic flush if online.
 */
export async function persistLearningState(state: UserLearningState): Promise<void> {
  const now = new Date().toISOString();

  await db.transaction("rw", [db.learningState, db.syncOutbox], async () => {
    await db.learningState.put({
      userId: state.userId,
      state,
      updatedAt: now,
    });

    await enqueue(
      "user_learning_state",
      "upsert",
      {
        user_id: state.userId,
        device_id: state.deviceId,
        state_json: state,
        updated_at: now,
      },
      { user_id: state.userId }
    );
  });

  if (typeof navigator !== "undefined" && navigator.onLine) {
    flushOutbox().catch(console.error);
  }
}

/**
 * Load UserLearningState from Dexie (local cache).
 * Returns null if not yet persisted.
 */
export async function loadPersistedState(userId: string): Promise<UserLearningState | null> {
  const row = await db.learningState.get(userId);
  return row?.state ?? null;
}
