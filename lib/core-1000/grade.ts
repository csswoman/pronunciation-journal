// Single write path for grading a Core 1000 card. Both the speak flow
// (quality derived from accuracy) and the self-grade fallback land here, so
// SM-2 state can never diverge between the two.

import { createSRSEntry, updateSRS } from "@/lib/srs";
import { calculateXP } from "@/lib/pronunciation/scoring";
import {
  getSRSData, saveSRSData, saveAttempt, updateDailyProgress, updateUserStats,
} from "@/lib/db";
import { core1000WordId } from "./types";

export interface GradeExtras {
  /** Accuracy 0–100 del scoring hablado. Ausente en self-grade. */
  accuracy?: number;
  transcript?: string;
}

export async function gradeCore1000Word(
  word: string,
  quality: number,
  extras: GradeExtras = {}
): Promise<void> {
  const normalized = word.toLowerCase();
  const wordId = core1000WordId(normalized);

  const current = (await getSRSData(wordId)) ?? createSRSEntry(wordId, normalized);
  await saveSRSData(updateSRS(current, quality));

  // Solo el camino hablado alimenta attempts/XP; el self-grade no inventa accuracy.
  if (extras.accuracy !== undefined) {
    const xp = calculateXP(extras.accuracy);
    await saveAttempt({
      word: normalized,
      lessonId: "core-1000",
      transcript: extras.transcript ?? "",
      accuracy: extras.accuracy,
      isCorrect: extras.accuracy >= 70,
      timestamp: new Date().toISOString(),
    });
    await updateDailyProgress(extras.accuracy, normalized, xp);
    await updateUserStats(extras.accuracy, xp);
  }
}
