import { db } from "@/lib/db";
import { getUserLearningState } from "@/lib/ai-practice/load-state";
import { syncCefrLevel } from "@/lib/users/queries";

/** Reads local AI learning state and syncs CEFR estimate to Supabase. Best-effort. */
export async function syncCefrFromLocalState(userId: string): Promise<void> {
  try {
    const localRow = await db.learningState.get(userId);
    const localState = localRow?.state ?? (await getUserLearningState(userId));
    await syncCefrLevel(userId, localState.level.cefrEstimate);
  } catch (error) {
    console.error("Failed to sync cefr_level:", error);
  }
}
