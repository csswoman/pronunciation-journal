import { deriveFsrsState } from "@/lib/srs/fsrs-migrate";
import { scheduleFsrsReview, type Grade } from "@/lib/srs/fsrs-schedule";
import { nextFsrsRealReviews } from "@/lib/srs/fsrs-optimizer-eligibility";
import { getSRSData, saveSRSData } from "@/lib/db";
import type { SRSData } from "@/lib/types";

/**
 * Namespace prefix for text_fragment SRS rows in Dexie's `srsData` table.
 * Mirrors the Core 1000 `c1k:` convention (lib/essential-words/types.ts) so a single
 * Dexie store holds multiple SRS domains keyed by string id.
 */
const FRAGMENT_SRS_PREFIX = "fragment:";

/** Namespaced Dexie key for a text_fragments row. */
export function fragmentSrsId(fragmentId: string): string {
  return `${FRAGMENT_SRS_PREFIX}${fragmentId}`;
}

function qualityToGrade(quality: number): Grade {
  const q = Math.max(0, Math.min(5, Math.round(quality)));
  if (q <= 2) return "Again";
  if (q === 3) return "Hard";
  if (q === 4) return "Good";
  return "Easy";
}

function withFsrsState(
  current: SRSData,
  now: Date,
): Required<Pick<SRSData, "stability" | "difficulty" | "state" | "fsrsRealReviews">> {
  if (
    current.stability !== undefined
    && current.difficulty !== undefined
    && current.state !== undefined
  ) {
    return {
      stability: current.stability,
      difficulty: current.difficulty,
      state: current.state,
      fsrsRealReviews: current.fsrsRealReviews ?? 0,
    };
  }

  const derived = deriveFsrsState(current, now);
  return {
    stability: derived.stability,
    difficulty: derived.difficulty,
    state: current.repetitions > 0 ? "Review" : "New",
    fsrsRealReviews: 0,
  };
}

/**
 * Apply an FSRS review to the local SRS state for a system `text_fragments`
 * sentence. These fragments are system content (`user_id = null`), so their
 * per-user review state lives client-side in Dexie rather than in a Supabase
 * per-user table — offline-first by construction. Mirrors `gradeEssentialWord`.
 *
 * `quality` is the 0–5 legacy grade, mapped to an FSRS Grade internally.
 */
export async function upsertFragmentSrs(
  fragmentId: string,
  quality: number,
): Promise<void> {
  const id = fragmentSrsId(fragmentId);
  const now = new Date();
  const current: SRSData = (await getSRSData(id)) ?? {
    wordId: id,
    word: id,
    ease: 2.5,
    interval: 0,
    repetitions: 0,
    nextReview: now.toISOString(),
  };
  const fsrsState = withFsrsState(current, now);
  const grade = qualityToGrade(quality);
  const scheduled = scheduleFsrsReview({
    stability: fsrsState.stability,
    difficulty: fsrsState.difficulty,
    state: fsrsState.state,
    grade,
    now,
  });

  await saveSRSData({
    ...current,
    stability: scheduled.stability,
    difficulty: scheduled.difficulty,
    state: scheduled.state,
    fsrsRealReviews: nextFsrsRealReviews(fsrsState.fsrsRealReviews, { isRepair: false }),
    nextReview: scheduled.dueAt.toISOString(),
    lastReview: now.toISOString(),
    repetitions: current.repetitions + (grade === "Again" ? 0 : 1),
  });
}
