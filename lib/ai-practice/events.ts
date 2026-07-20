"use client";

import { db, type AnalyticsEventName } from "@/lib/db";

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
  userId?: string | null,
): Promise<void> {
  // Analytics is private learning evidence: do not write a device-global row
  // while auth is unresolved.
  if (!userId) return;
  const timestamp = new Date().toISOString();

  const id = await db.analyticsEvents.add({
    userId,
    name,
    payload: payload as Record<string, unknown>,
    timestamp,
    synced: 0,
  });

  void id;
}

/** Flush events that haven't been synced yet (called opportunistically). */
/** Prune events older than `days` that have already been synced. */
export async function pruneEvents(userId: string, days = 30): Promise<void> {
  const cutoff = new Date(Date.now() - days * 86_400_000).toISOString();
  await db.analyticsEvents
    .where("timestamp")
    .below(cutoff)
    .filter(e => e.userId === userId && e.synced === 1)
    .delete();
}
