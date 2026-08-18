import { scorePronunciation } from "@/lib/pronunciation/scoring";
import { feedbackFromScoringResult } from "@/lib/pronunciation/feedback/from-scoring";
import { persistPronunciationFeedbackEvidence } from "@/lib/pronunciation/feedback/persistence";
import { savePracticeAnswer } from "@/lib/practice/queries";
import { recordActivitySession } from "@/lib/progress/activity-hub";
import { buildSessionResult } from "@/lib/practice/session-result";
import type { PracticeAnswer } from "@/lib/practice/types";
import { saveMasteredToDexie } from "@/lib/ai-coach/pronunciation";
import type { WordIPA, SoundProgress } from "@/components/ai-coach/pronunciation/types";
import type { ScoringResult } from "@/lib/types";
import type { Dispatch, SetStateAction } from "react";

type AnalyzeArgs = {
  transcript: string;
  activePhrase: string;
  userId: string | undefined;
  setLatestScoring: Dispatch<SetStateAction<ScoringResult | null>>;
  setWordIPAs: Dispatch<SetStateAction<WordIPA[]>>;
  setSoundProgress: Dispatch<SetStateAction<SoundProgress>>;
  setMastered: Dispatch<SetStateAction<Set<string>>>;
};

export async function analyzePronunciationRecording({
  transcript,
  activePhrase,
  userId,
  setLatestScoring,
  setWordIPAs,
  setSoundProgress,
  setMastered,
}: AnalyzeArgs): Promise<void> {
  if (!transcript || !activePhrase) return;

  // Shared sequence alignment (lib/pronunciation/scoring.ts) instead of
  // index-zipping phrase words against transcript words — an omitted
  // word no longer shifts every later word's feedback.
  const scoring = await scorePronunciation(transcript, activePhrase);
  setLatestScoring(scoring);
  if (userId) {
    const feedback = feedbackFromScoringResult({
      accuracy: scoring.accuracy,
      transcript: scoring.transcript,
      wordResults: scoring.wordResults,
      evaluatorVersion: "coach-stt-v1",
    });
    void persistPronunciationFeedbackEvidence(userId, feedback).catch(() => undefined);
  }

  // Map results back onto the original phrase's words by matching
  // expected text (skip "extra" entries — they have no expected word).
  const byExpected = new Map(
    scoring.wordResults
      .filter((r) => r.status !== "extra")
      .map((r) => [r.expected.toLowerCase(), r] as const),
  );

  setWordIPAs((prev) =>
    prev.map((entry) => {
      const clean = entry.word.replace(/[^a-zA-Z']/g, "").toLowerCase();
      const match = byExpected.get(clean);
      return { ...entry, alignment: match?.phonemes?.alignment ?? null };
    }),
  );

  setSoundProgress((prev) => {
    const next = { ...prev };
    for (const result of scoring.wordResults) {
      for (const alignment of result.phonemes?.alignment ?? []) {
        const key = alignment.phoneme;
        if (!next[key]) next[key] = { correct: 0, total: 0 };
        next[key].total += 1;
        if (alignment.status === "correct") next[key].correct += 1;
      }
    }
    return next;
  });

  if (scoring.isCorrect) {
    setMastered((prev) => {
      const next = new Set(prev).add(activePhrase);
      if (userId) void saveMasteredToDexie(userId, next);
      return next;
    });
  }

  if (userId) {
    const contentId = `ai_coach:pronunciation:${activePhrase.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    const answer: PracticeAnswer = {
      exerciseId: contentId,
      slug: "speak_word",
      exerciseTypeId: 10,
      isCorrect: scoring.isCorrect,
      userAnswer: transcript,
      score: scoring.accuracy,
      contentId,
      context: "ai_coach",
      timeMs: 0,
      exercisePayload: { targetWord: activePhrase },
    };
    await savePracticeAnswer(userId, answer);
    await recordActivitySession(userId, {
      practiceContext: "ai_coach",
      sessionResult: buildSessionResult([{ ...answer, completedAt: new Date() }]),
      metadata: { coachTool: "pronunciation_coach" },
    });
  }
}
