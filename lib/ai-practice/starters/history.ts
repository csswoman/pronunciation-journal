import { db } from "@/lib/db";
import type { StarterId } from "./types";

/** How many past uses feed the anti-repetition filter. */
export const MAX_STARTER_HISTORY = 10;

const KEY_PREFIX = "coachStarters:";

export interface StarterHistory {
  ids: StarterId[];
  angles: string[];
}

const EMPTY: StarterHistory = { ids: [], angles: [] };

export async function readStarterHistory(userId: string): Promise<StarterHistory> {
  const row = await db.practicePrefs.get(`${KEY_PREFIX}${userId}`);
  if (!row) return EMPTY;
  try {
    const value: unknown = JSON.parse(row.value);
    if (!value || typeof value !== "object") return EMPTY;
    const o = value as { ids?: unknown; angles?: unknown };
    return {
      ids: Array.isArray(o.ids) ? (o.ids.filter((i) => typeof i === "string") as StarterId[]) : [],
      angles: Array.isArray(o.angles) ? o.angles.filter((a): a is string => typeof a === "string") : [],
    };
  } catch {
    return EMPTY;
  }
}

export async function recordStarterUse(
  userId: string,
  id: StarterId,
  angle: string,
): Promise<void> {
  const current = await readStarterHistory(userId);
  const next: StarterHistory = {
    ids: [id, ...current.ids].slice(0, MAX_STARTER_HISTORY),
    angles: [angle, ...current.angles].slice(0, MAX_STARTER_HISTORY),
  };
  await db.practicePrefs.put({
    key: `${KEY_PREFIX}${userId}`,
    value: JSON.stringify(next),
    updatedAt: new Date().toISOString(),
  });
}
