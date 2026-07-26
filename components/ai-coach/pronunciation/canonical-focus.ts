import { ARPABET_TO_IPA } from "@/lib/pronunciation/phonemes";
import { feedbackFromScoringResult } from "@/lib/pronunciation/feedback/from-scoring";
import type { ScoringResult } from "@/lib/types";

export function canonicalFocusFromScoring(scoring: ScoringResult | null) {
  if (!scoring) return null;
  const feedback = feedbackFromScoringResult({
    accuracy: scoring.accuracy,
    transcript: scoring.transcript,
    wordResults: scoring.wordResults,
    evaluatorVersion: "coach-stt-v1",
  });
  const expected = feedback.priority?.expected?.replace(/^\/+|\/+$/g, "");
  if (!expected) return null;

  for (const word of scoring.wordResults) {
    for (const alignment of word.phonemes?.alignment ?? []) {
      const alignedIpa = alignment.ipa ?? ARPABET_TO_IPA[alignment.phoneme];
      if (alignment.status !== "correct" && alignedIpa === expected) {
        return {
          word: word.expected,
          phoneme: alignment.phoneme,
          ipa: alignedIpa ?? alignment.phoneme,
        };
      }
    }
  }
  return null;
}
