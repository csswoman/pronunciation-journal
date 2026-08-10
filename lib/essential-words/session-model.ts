import { essentialWordId } from "@/lib/essential-words/types";
import type { GradeExtras } from "@/lib/essential-words/grade";
import type { EssentialWordMode } from "@/lib/essential-words/exercise-modes";
import type { EssentialWordQueueItem } from "@/lib/essential-words/queue";
import type { ExerciseResult } from "@/lib/practice/types";

export type EssentialWordsPhase = "loading" | "ready" | "study" | "speak" | "done" | "empty" | "error";

export interface EssentialWordsSessionSummary {
  practiced: number;
  correct: number;
}

export function phaseForEssentialWordItem(item: EssentialWordQueueItem): EssentialWordsPhase {
  return item.kind === "new" ? "study" : "speak";
}

export function buildEssentialWordExerciseResult(
  item: EssentialWordQueueItem,
  quality: number,
  extras?: GradeExtras,
  mode: EssentialWordMode = "speak_sentence",
  timeMs = 0,
): ExerciseResult {
  const wordId = essentialWordId(item.entry.word.toLowerCase());
  const isSpeech = extras?.accuracy !== undefined;

  return {
    exerciseId: wordId,
    // slug/exerciseTypeId stay keyed on speech-vs-text so historical rows in
    // answer_history remain comparable; `mode` in the payload carries the
    // finer detail without widening the shared PracticeAnswer type.
    slug: isSpeech ? "speak_word" : "fill_blank",
    exerciseTypeId: isSpeech ? 10 : 5,
    isCorrect: quality >= 3,
    userAnswer: extras?.transcript,
    contentId: wordId,
    context: "essential-words",
    timeMs: Math.max(0, Math.round(timeMs)),
    score: extras?.accuracy,
    completedAt: new Date(),
    exercisePayload: { mode },
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
