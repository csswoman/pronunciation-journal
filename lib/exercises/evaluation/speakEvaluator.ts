import { scorePronunciation } from "@/lib/pronunciation/scoring";
import { cefrToNumber } from "@/lib/exercises/cefr";
import type { EvaluationResult } from "@/lib/exercises/design";
import type { EvaluationInput } from "./types";
import type { CEFRLevel } from "@/lib/exercises/cefr";
import type { WordResult } from "@/lib/types";

const DEFAULT_THRESHOLD = 70;

function thresholdForLevel(userLevel?: CEFRLevel): number {
  if (!userLevel) return DEFAULT_THRESHOLD;
  // A1=55, A2=60, B1=70, B2=78, C1=85, C2=90
  const thresholds = [55, 60, 70, 78, 85, 90];
  return thresholds[cefrToNumber(userLevel) - 1] ?? DEFAULT_THRESHOLD;
}

/**
 * Extract the first missed phoneme from word-level results to give a specific tip.
 * Returns IPA if available, otherwise the ARPAbet symbol.
 */
function firstMissedPhoneme(wordResults?: WordResult[]): string | null {
  if (!wordResults) return null;
  for (const wr of wordResults) {
    if (!wr.phonemes?.alignment) continue;
    for (const p of wr.phonemes.alignment) {
      if (p.status !== "correct") {
        return p.ipa ?? p.phoneme;
      }
    }
  }
  return null;
}

function feedbackForScore(
  score: number,
  threshold: number,
  transcript: string,
  expected: string,
  userLevel?: CEFRLevel,
  wordResults?: WordResult[]
): EvaluationResult["feedback"] {
  const isEarlyLearner = !userLevel || cefrToNumber(userLevel) <= 2;
  const passed = score >= threshold;
  const missedPhoneme = firstMissedPhoneme(wordResults);

  if (passed) {
    return {
      immediate: score >= 90 ? "Excellent!" : "Good!",
      explanation: isEarlyLearner
        ? `You said: "${transcript}" — that's correct!`
        : `Accuracy: ${Math.round(score)}%. "${transcript}" matches the target well.`,
      tip: score >= 90
        ? undefined
        : missedPhoneme
          ? `Almost perfect — watch the /${missedPhoneme}/ sound in "${expected}".`
          : isEarlyLearner
            ? `Keep practicing: "${expected}"`
            : `Good, but aim for even clearer pronunciation of "${expected}".`,
    };
  }

  const phonemeTip = missedPhoneme
    ? `Focus on the /${missedPhoneme}/ sound — listen to the model and try again.`
    : isEarlyLearner
      ? "Listen to the word and repeat slowly."
      : "Try breaking the word into syllables and recording again.";

  return {
    immediate: isEarlyLearner ? "Almost!" : "Not quite.",
    explanation: isEarlyLearner
      ? `You said: "${transcript}". Try again — the target is "${expected}".`
      : `Accuracy: ${Math.round(score)}%. Target: "${expected}". Focus on matching each syllable.`,
    tip: phonemeTip,
  };
}

export async function evaluateSpeak(input: EvaluationInput): Promise<EvaluationResult> {
  if (input.actual.kind !== "speech") {
    throw new Error("speakEvaluator: expected speech answer");
  }

  const { transcript } = input.actual;
  const threshold = input.threshold ?? thresholdForLevel(input.userLevel);
  // Minimal pair and phoneme exercises require exact word matching — "bit" and "beat"
  // differ by 1 edit but must NOT be treated as equivalent, since distinguishing them
  // is the entire learning objective.
  const strictWordMatch =
    input.exercise.variant === "minimal_pair" || input.exercise.variant === "phoneme";
  const scoring = await scorePronunciation(transcript, input.expected, threshold, strictWordMatch);

  const passed = scoring.accuracy >= threshold;

  return {
    correct: passed,
    category: passed ? "correct" : "incorrect_form",
    errorCode: passed ? "correct" : "form_error",
    userAnswer: transcript,
    expectedAnswer: input.expected,
    feedback: feedbackForScore(
      scoring.accuracy,
      threshold,
      transcript,
      input.expected,
      input.userLevel,
      scoring.wordResults
    ),
    score: Math.round(scoring.accuracy),
    gradedBy: "client",
    ...(scoring.wordResults ? { wordResults: scoring.wordResults } : {}),
  };
}
