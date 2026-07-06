import { core1000WordId } from "@/lib/core-1000/types";
import type { GradeExtras } from "@/lib/core-1000/grade";
import type { Core1000QueueItem } from "@/lib/core-1000/queue";
import type { ExerciseResult } from "@/lib/practice/types";

export type EssentialWordsPhase = "loading" | "study" | "speak" | "done" | "empty" | "error";

export interface EssentialWordsSessionSummary {
  practiced: number;
  correct: number;
}

export function phaseForCore1000Item(item: Core1000QueueItem): EssentialWordsPhase {
  return item.kind === "new" ? "study" : "speak";
}

export function buildCore1000ExerciseResult(
  item: Core1000QueueItem,
  quality: number,
  extras?: GradeExtras,
): ExerciseResult {
  const wordId = core1000WordId(item.entry.word.toLowerCase());
  const isSpeech = extras?.accuracy !== undefined;

  return {
    exerciseId: wordId,
    slug: isSpeech ? "speak_word" : "fill_blank",
    exerciseTypeId: isSpeech ? 10 : 5,
    isCorrect: quality >= 3,
    userAnswer: extras?.transcript,
    contentId: wordId,
    context: "core-1000",
    timeMs: 0,
    score: extras?.accuracy,
    completedAt: new Date(),
  };
}

export function advanceSummary(
  previous: EssentialWordsSessionSummary | null,
  isCorrect: boolean,
): EssentialWordsSessionSummary {
  return {
    practiced: (previous?.practiced ?? 0) + 1,
    correct: (previous?.correct ?? 0) + (isCorrect ? 1 : 0),
  };
}
