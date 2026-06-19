import { createSRSEntry, updateSRS } from "@/lib/srs";
import { getSRSData, saveSRSData } from "@/lib/db";

/**
 * Namespace prefix for text_fragment SRS rows in Dexie's `srsData` table.
 * Mirrors the Core 1000 `c1k:` convention (lib/core-1000/types.ts) so a single
 * Dexie store holds multiple SRS domains keyed by string id.
 */
const FRAGMENT_SRS_PREFIX = "fragment:";

/** Namespaced Dexie key for a text_fragments row. */
export function fragmentSrsId(fragmentId: string): string {
  return `${FRAGMENT_SRS_PREFIX}${fragmentId}`;
}

/**
 * Apply an SM-2 review to the local SRS state for a system `text_fragments`
 * sentence. These fragments are system content (`user_id = null`), so their
 * per-user review state lives client-side in Dexie rather than in a Supabase
 * per-user table — offline-first by construction. Mirrors `gradeCore1000Word`.
 *
 * `quality` is the 0–5 SM-2 grade (see answerToGrade).
 */
export async function upsertFragmentSrs(
  fragmentId: string,
  quality: number,
): Promise<void> {
  const id = fragmentSrsId(fragmentId);
  const current = (await getSRSData(id)) ?? createSRSEntry(id, id);
  await saveSRSData(updateSRS(current, quality));
}
