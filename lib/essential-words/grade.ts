// Single write path for grading a Core 1000 card. Both the speak flow
// (quality derived from accuracy) and the self-grade fallback land here, so
// FSRS state can never diverge between the two.

import { deriveFsrsState } from "@/lib/srs/fsrs-migrate";
import { scheduleFsrsReview, type Grade } from "@/lib/srs/fsrs-schedule";
import { nextFsrsRealReviews } from "@/lib/srs/fsrs-optimizer-eligibility";
import { calculateXP } from "@/lib/pronunciation/scoring";
import {
  getSRSData, saveSRSData, saveAttempt, updateDailyProgress, updateUserStats,
} from "@/lib/db";
import { essentialWordId } from "./types";
import type { SRSData } from "@/lib/types";

export interface GradeExtras {
  /** Accuracy 0–100 del scoring hablado. Ausente en self-grade. */
  accuracy?: number;
  transcript?: string;
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

export async function gradeEssentialWord(
  word: string,
  quality: number,
  extras: GradeExtras = {},
  userId?: string,
): Promise<void> {
  const normalized = word.toLowerCase();
  const wordId = essentialWordId(normalized);

  if (!userId) return;
  const now = new Date();
  const current: SRSData = (await getSRSData(wordId, userId)) ?? {
    wordId,
    word: normalized,
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
  }, userId);

  // Solo el camino hablado alimenta attempts/XP; el self-grade no inventa accuracy.
  if (extras.accuracy !== undefined) {
    const xp = calculateXP(extras.accuracy);
    await saveAttempt({
      word: normalized,
      lessonId: "essential-words",
      transcript: extras.transcript ?? "",
      accuracy: extras.accuracy,
      isCorrect: extras.accuracy >= 70,
      timestamp: new Date().toISOString(),
    }, userId);
    await updateDailyProgress(extras.accuracy, normalized, xp, userId);
    await updateUserStats(extras.accuracy, xp, userId);
  }

}
