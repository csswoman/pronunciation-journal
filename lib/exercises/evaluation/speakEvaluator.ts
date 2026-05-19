import { scorePronunciation } from "@/lib/pronunciation/scoring";
import { cefrToNumber } from "@/lib/exercises/cefr";
import type { EvaluationResult } from "@/lib/exercises/design";
import type { EvaluationInput } from "./types";
import type { CEFRLevel } from "@/lib/exercises/cefr";

const DEFAULT_THRESHOLD = 70;

function thresholdForLevel(userLevel?: CEFRLevel): number {
  if (!userLevel) return DEFAULT_THRESHOLD;
  // A1=55, A2=60, B1=70, B2=78, C1=85, C2=90
  const thresholds = [55, 60, 70, 78, 85, 90];
  return thresholds[cefrToNumber(userLevel) - 1] ?? DEFAULT_THRESHOLD;
}

function feedbackForScore(
  score: number,
  threshold: number,
  transcript: string,
  expected: string,
  userLevel?: CEFRLevel
): EvaluationResult["feedback"] {
  const isEarlyLearner = !userLevel || cefrToNumber(userLevel) <= 2;
  const passed = score >= threshold;

  if (passed) {
    return {
      immediate: score >= 90 ? "✓ Excellent!" : "✓ Good!",
      explanation: isEarlyLearner
        ? `You said: "${transcript}" — that's correct!`
        : `Accuracy: ${Math.round(score)}%. "${transcript}" matches the target well.`,
      tip: score >= 90
        ? undefined
        : isEarlyLearner
          ? `Keep practicing: "${expected}"`
          : `Good, but aim for even clearer pronunciation of "${expected}".`,
    };
  }

  return {
    immediate: isEarlyLearner ? "Almost!" : "Not quite.",
    explanation: isEarlyLearner
      ? `You said: "${transcript}". Try again — the target is "${expected}".`
      : `Accuracy: ${Math.round(score)}%. Target: "${expected}". Focus on matching each syllable.`,
    tip: isEarlyLearner
      ? "Listen to the word and repeat slowly."
      : "Try breaking the word into syllables and recording again.",
  };
}

export async function evaluateSpeak(input: EvaluationInput): Promise<EvaluationResult> {
  if (input.actual.kind !== "speech") {
    throw new Error("speakEvaluator: expected speech answer");
  }

  const { transcript } = input.actual;
  const threshold = input.threshold ?? thresholdForLevel(input.userLevel);
  const scoring = await scorePronunciation(transcript, input.expected, threshold);

  const passed = scoring.accuracy >= threshold;

  return {
    correct: passed,
    category: passed ? "correct" : "incorrect_form",
    userAnswer: transcript,
    expectedAnswer: input.expected,
    feedback: feedbackForScore(
      scoring.accuracy,
      threshold,
      transcript,
      input.expected,
      input.userLevel
    ),
    score: Math.round(scoring.accuracy),
    gradedBy: "client",
    ...(scoring.wordResults ? { wordResults: scoring.wordResults } : {}),
  };
}
