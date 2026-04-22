"use client";

import { db, type AnalyticsEventName } from "@/lib/db";
import { enqueue, flushOutbox } from "@/lib/sync/sync-manager";

export type EventPayloads = {
  exercise_shown:        { exerciseType: string; topic: string; conversationId?: number };
  exercise_answered:     { exerciseType: string; topic: string; correct: boolean; latencyMs: number };
  exercise_correct:      { exerciseType: string; topic: string };
  next_clicked:          { topic: string };
  retry_clicked:         { topic: string; attempts: number };
  exercise_abandoned:    { topic: string; timeSpentMs: number };
  auto_next_triggered:   { topic: string; delayMs: number };
  time_to_first_exercise: { timeMs: number };
  session_started:       { mode: string; conversationId?: number };
  session_ended:         { mode: string; exercisesCompleted: number; correctRate: number; durationMs: number };
};

export async function logEvent<N extends AnalyticsEventName>(
  name: N,
  payload: EventPayloads[N],
): Promise<void> {
  const timestamp = new Date().toISOString();

  const id = await db.analyticsEvents.add({
    name,
    payload: payload as Record<string, unknown>,
    timestamp,
    synced: 0,
  });

  await enqueue(
    "ai_events",
    "insert",
    { event_name: name, payload, occurred_at: timestamp },
  );

  if (typeof navigator !== "undefined" && navigator.onLine) {
    // Fire-and-forget: don't block the caller
    flushBatch(id).catch(() => {});
  }
}

/** Flush events that haven't been synced yet (called opportunistically). */
async function flushBatch(upToId: number): Promise<void> {
  await flushOutbox();
  // Mark synced locally so we can prune stale rows later
  await db.analyticsEvents
    .where("id")
    .belowOrEqual(upToId)
    .modify({ synced: 1 });
}

/** Prune events older than `days` that have already been synced. */
export async function pruneEvents(days = 30): Promise<void> {
  const cutoff = new Date(Date.now() - days * 86_400_000).toISOString();
  await db.analyticsEvents
    .where("timestamp")
    .below(cutoff)
    .filter(e => e.synced === 1)
    .delete();
}
