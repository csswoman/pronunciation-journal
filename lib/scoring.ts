import type { ScoringResult, WordResult, WordStatus } from "./types";

/**
 * Score a pronunciation attempt by comparing the transcript
 * against the target text using word-level diff.
 */
export function scorePronunciation(
  transcript: string,
  target: string,
  threshold = 70
): ScoringResult {
  const normalizedTranscript = normalize(transcript);
  const normalizedTarget = normalize(target);

  const transcriptWords = normalizedTranscript.split(/\s+/).filter(Boolean);
  const targetWords = normalizedTarget.split(/\s+/).filter(Boolean);

  const wordResults = diffWords(targetWords, transcriptWords);

  const correctCount = wordResults.filter((r) => r.status === "correct").length;
  const totalExpected = targetWords.length;
  const accuracy =
    totalExpected === 0 ? 0 : Math.round((correctCount / totalExpected) * 100);

  return {
    accuracy,
    isCorrect: accuracy >= threshold,
    transcript: normalizedTranscript,
    wordResults,
  };
}

/**
 * Normalize text for comparison: lowercase, remove punctuation, trim.
 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s']/g, "") // keep apostrophes (e.g., don't)
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Diff two word arrays using Levenshtein-style alignment.
 * Returns per-word results with status.
 */
function diffWords(expected: string[], got: string[]): WordResult[] {
  const m = expected.length;
  const n = got.length;

  // Build DP table for edit distance with alignment tracking
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0)
  );

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (wordsMatch(expected[i - 1], got[j - 1])) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j],     // deletion (missing word)
          dp[i][j - 1],     // insertion (extra word)
          dp[i - 1][j - 1]  // substitution (incorrect word)
        );
      }
    }
  }

  // Backtrack to build alignment
  const results: WordResult[] = [];
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && wordsMatch(expected[i - 1], got[j - 1])) {
      results.unshift({
        expected: expected[i - 1],
        got: got[j - 1],
        status: "correct",
      });
      i--;
      j--;
    } else if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + 1) {
      results.unshift({
        expected: expected[i - 1],
        got: got[j - 1],
        status: "incorrect",
      });
      i--;
      j--;
    } else if (j > 0 && dp[i][j] === dp[i][j - 1] + 1) {
      results.unshift({
        expected: "",
        got: got[j - 1],
        status: "extra",
      });
      j--;
    } else {
      results.unshift({
        expected: expected[i - 1] || "",
        got: "",
        status: "missing",
      });
      i--;
    }
  }

  return results;
}

/**
 * Fuzzy word matching to handle minor STT variations.
 * Uses Levenshtein distance with a tolerance threshold.
 */
function wordsMatch(a: string, b: string): boolean {
  if (a === b) return true;

  // For short words (<=3 chars), require exact match
  if (a.length <= 3 || b.length <= 3) return a === b;

  // For longer words, allow Levenshtein distance <= 1
  return levenshtein(a, b) <= 1;
}

/**
 * Calculate Levenshtein distance between two strings.
 */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0)
  );

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[m][n];
}

/**
 * Calculate XP earned based on accuracy.
 */
export function calculateXP(accuracy: number): number {
  if (accuracy >= 95) return 15;
  if (accuracy >= 80) return 10;
  if (accuracy >= 60) return 5;
  if (accuracy >= 40) return 2;
  return 1;
}

/**
 * Get a feedback message based on accuracy.
 */
export function getFeedbackMessage(accuracy: number): {
  message: string;
  emoji: string;
  color: string;
} {
  if (accuracy >= 95) return { message: "Perfect!", emoji: "🎯", color: "text-green-500" };
  if (accuracy >= 80) return { message: "Great job!", emoji: "🔥", color: "text-green-400" };
  if (accuracy >= 60) return { message: "Good effort!", emoji: "👍", color: "text-yellow-500" };
  if (accuracy >= 40) return { message: "Keep practicing!", emoji: "💪", color: "text-orange-500" };
  return { message: "Try again!", emoji: "🔄", color: "text-red-500" };
}
