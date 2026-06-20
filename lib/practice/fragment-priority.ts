import { getSRSData } from "@/lib/db";
import { fragmentSrsId } from "./fragment-srs";
import type { TextFragment } from "@/lib/exercises/generators/reorder-from-fragments";
import type { SRSData } from "@/lib/types";

/** Bucket order: due (0) → unseen (1) → not-yet-due (2). */
function dueBucket(srs: SRSData | undefined, now: Date): 0 | 1 | 2 {
  if (!srs) return 1; // never reviewed
  return new Date(srs.nextReview).getTime() <= now.getTime() ? 0 : 2;
}

/**
 * Pure reordering: surface fragments whose SRS review is due, then the ones the
 * user has never seen, then the not-yet-due. Stable within each bucket so the
 * caller's existing (random-sampled) order is preserved as a tiebreaker.
 *
 * `srsByKey` is keyed by the namespaced Dexie id (see fragmentSrsId).
 */
export function prioritizeFragmentsByDue(
  fragments: TextFragment[],
  srsByKey: Map<string, SRSData>,
  now: Date = new Date(),
): TextFragment[] {
  return fragments
    .map((fragment, index) => ({
      fragment,
      index,
      bucket: dueBucket(srsByKey.get(fragmentSrsId(fragment.id)), now),
    }))
    .sort((a, b) => a.bucket - b.bucket || a.index - b.index)
    .map((entry) => entry.fragment);
}

/**
 * Reads each fragment's local SRS state from Dexie and returns them ordered
 * with due reviews first. Thin I/O wrapper over prioritizeFragmentsByDue so the
 * ordering logic stays pure and testable.
 */
export async function orderFragmentsByDue(
  fragments: TextFragment[],
  now: Date = new Date(),
): Promise<TextFragment[]> {
  const entries = await Promise.all(
    fragments.map(async (fragment) => {
      const srs = await getSRSData(fragmentSrsId(fragment.id));
      return [fragmentSrsId(fragment.id), srs] as const;
    }),
  );

  const srsByKey = new Map<string, SRSData>();
  for (const [key, srs] of entries) {
    if (srs) srsByKey.set(key, srs);
  }

  return prioritizeFragmentsByDue(fragments, srsByKey, now);
}
