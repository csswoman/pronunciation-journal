// Reads the user's stored CEFR level from Dexie. Offline-safe: the value is
// hydrated from `user_profiles.cefr_level` at login (see AuthProvider) and kept
// in `db.learningState`. Used to seed the Essential Words level filter so a
// placed learner starts at their level instead of grinding rank #1 upward.

import { db } from "@/lib/db";
import { CEFR_LEVELS, type CefrLevel } from "./types";

const KNOWN = new Set<string>(CEFR_LEVELS);

/**
 * Returns the stored CEFR level, or null when unknown/unset. C2 (which the app
 * type does not model) is folded down to C1, the dataset's top level.
 */
export async function readStoredCefrLevel(userId: string): Promise<CefrLevel | null> {
  try {
    const row = await db.learningState.get(userId);
    const level = row?.state?.level?.cefrEstimate;
    if (!level) return null;
    if (level === "C2") return "C1";
    return KNOWN.has(level) ? (level as CefrLevel) : null;
  } catch {
    return null;
  }
}
