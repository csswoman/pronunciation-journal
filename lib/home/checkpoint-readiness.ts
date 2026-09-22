import { LEVEL_ASSESSMENT_CONTRACTS } from "@/lib/courses/curriculum";
import type { CefrLevelId } from "@/lib/courses/types";

const RECENT_ATTEMPT_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;

export interface CheckpointReadinessInput {
  /** Nivel resuelto del alumno, ya en minúsculas (ver nota de mapeo en el plan). */
  level: CefrLevelId;
  completedLessonSlugs: ReadonlySet<string>;
  /** Slugs de deck cuyo topic_srs está mastered o review con repetitions >= 2. */
  evidencedDeckSlugs: ReadonlySet<string>;
  /** `completed_at` del checkpoint más reciente (assessment_results.mode='checkpoint'). */
  lastCheckpointAt?: string | null;
  now?: number;
}

export interface CheckpointReadiness {
  ready: boolean;
  level: CefrLevelId;
  requiredTotal: number;
  completedRequired: number;
  evidencedRequired: number;
  missingSlugs: string[];
  reason: "ready" | "lessons_missing" | "no_evidence" | "recent_attempt";
}

/**
 * Pure function: decides whether a learner is ready for their level's
 * checkpoint assessment. Deterministic — no I/O, no clock reads unless
 * `now` is omitted (defaults to Date.now() for callers, but tests always
 * pass it explicitly).
 */
export function computeCheckpointReadiness(
  input: CheckpointReadinessInput,
): CheckpointReadiness {
  const { level, completedLessonSlugs, evidencedDeckSlugs, lastCheckpointAt } = input;
  const now = input.now ?? Date.now();

  const required = LEVEL_ASSESSMENT_CONTRACTS[level].requiredLessonSlugs;
  const requiredTotal = required.length;

  const missingSlugs = required.filter((slug) => !completedLessonSlugs.has(slug));
  const completedRequired = requiredTotal - missingSlugs.length;
  const evidencedRequired = required.filter((slug) => evidencedDeckSlugs.has(slug)).length;

  const allLessonsCompleted = missingSlugs.length === 0;
  const minimumEvidence = Math.ceil(requiredTotal / 2);
  const hasEnoughEvidence = evidencedRequired >= minimumEvidence;

  const recentAttempt =
    Boolean(lastCheckpointAt) &&
    now - new Date(lastCheckpointAt as string).getTime() < RECENT_ATTEMPT_WINDOW_MS;

  let reason: CheckpointReadiness["reason"];
  if (!allLessonsCompleted) {
    reason = "lessons_missing";
  } else if (!hasEnoughEvidence) {
    reason = "no_evidence";
  } else if (recentAttempt) {
    reason = "recent_attempt";
  } else {
    reason = "ready";
  }

  return {
    ready: reason === "ready",
    level,
    requiredTotal,
    completedRequired,
    evidencedRequired,
    missingSlugs,
    reason,
  };
}
