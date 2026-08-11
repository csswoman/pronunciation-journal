import type { SRSData } from "@/lib/types";
import { db } from "@/lib/db";
import { ESSENTIAL_WORD_PREFIX } from "./types";
import { localDateKey } from "./ready-date";

/** Pure: count SRS entries due exactly on the calendar day after `now`. */
export function countDueTomorrow(entries: SRSData[], now: Date): number {
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowKey = localDateKey(tomorrow);

  return entries.filter((entry) => {
    const reviewDate = new Date(entry.nextReview);
    return localDateKey(reviewDate) === tomorrowKey;
  }).length;
}

/** Dexie-backed: reviews scheduled for tomorrow across the user's Essential Words deck. */
export async function getEssentialWordsDueTomorrowCount(userId?: string): Promise<number> {
  if (!userId) return 0;
  const entries = await db.srsData
    .filter((e) => e.userId === userId && e.wordId.startsWith(ESSENTIAL_WORD_PREFIX))
    .toArray();
  return countDueTomorrow(entries, new Date());
}
