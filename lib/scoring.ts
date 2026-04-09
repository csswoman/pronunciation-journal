import type { ScoringResult, WordResult } from "./types";
import { analyzePhonemes } from "./phonemes";

const MAX_SCORE_CACHE_ENTRIES = 300;
const scoreCache = new Map<string, ScoringResult>();

function cloneResult(result: ScoringResult): ScoringResult {
  if (typeof structuredClone === "function") {
    return structuredClone(result);
  }
  return JSON.parse(JSON.stringify(result)) as ScoringResult;
}

/**
 * Score a pronunciation attempt by comparing the transcript
 * against the target text using word-level diff.
 */
export async function scorePronunciation(
  transcript: string,
  target: string,
  threshold = 70
): Promise<ScoringResult> {
  const normalizedTranscript = normalize(transcript);
  const normalizedTarget = normalize(target);
  const cacheKey = `${threshold}::${normalizedTarget}::${normalizedTranscript}`;

  const cached = scoreCache.get(cacheKey);
  if (cached) {
    return cloneResult(cached);
  }

  const transcriptWords = normalizedTranscript.split(/\s+/).filter(Boolean);
  const targetWords = normalizedTarget.split(/\s+/).filter(Boolean);

  const wordResults = diffWords(targetWords, transcriptWords);

  // Enrich all words (except "extra") with phoneme data in parallel
  await Promise.all(
    wordResults
      .filter((r) => r.status !== "extra" && r.expected)
      .map(async (r) => {
        r.phonemes = await analyzePhonemes(r.expected, r.got ?? "");
      })
  );

  // Phoneme-level accuracy: more granular than word-level binary scoring.
  // "world" heard as "word" → W✓ ER✓ L✗ D✓ = 75%, not 100%.
  let totalPhonemes = 0;
  let correctPhonemes = 0;

  for (const r of wordResults) {
    if (r.status === "extra") continue;

    const alignment = r.phonemes?.alignment;
    if (!alignment || alignment.length === 0) {
      // No phoneme data — fall back to binary word score
      totalPhonemes += 1;
      if (r.status === "correct") correctPhonemes += 1;
      continue;
    }

    const wordCorrect = alignment.filter((p) => p.status === "correct").length;
    totalPhonemes += alignment.length;
    correctPhonemes += wordCorrect;

    // Downgrade fuzzy word-matches that aren't phonemically perfect
    if (r.status === "correct" && wordCorrect < alignment.length) {
      r.status = "incorrect";
    }
  }

  const accuracy = totalPhonemes === 0 ? 0 : Math.round((correctPhonemes / totalPhonemes) * 100);

  const result: ScoringResult = {
    accuracy,
    isCorrect: accuracy >= threshold,
    transcript: normalizedTranscript,
    wordResults,
  };

  if (scoreCache.size >= MAX_SCORE_CACHE_ENTRIES) {
    const oldest = scoreCache.keys().next().value;
    if (oldest) scoreCache.delete(oldest);
  }
  scoreCache.set(cacheKey, cloneResult(result));

  return result;
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
 * Get a feedback message based on accuracy and threshold (difficulty).
 * Hard mode (threshold >= 85) raises the bar for each tier.
 */
export function getFeedbackMessage(
  accuracy: number,
  threshold = 70
): { message: string; emoji: string; color: string } {
  const hard = threshold >= 85;
  if (hard) {
    if (accuracy >= 95) return { message: "Mastered!", emoji: "🏆", color: "text-green-500" };
    if (accuracy >= 85) return { message: "Excellent!", emoji: "🎯", color: "text-green-400" };
    if (accuracy >= 70) return { message: "Almost there!", emoji: "💪", color: "text-yellow-500" };
    if (accuracy >= 50) return { message: "Keep pushing!", emoji: "🔄", color: "text-orange-500" };
    return { message: "Try again!", emoji: "❌", color: "text-red-500" };
  }
  if (accuracy >= 90) return { message: "Perfect!", emoji: "🎯", color: "text-green-500" };
  if (accuracy >= 75) return { message: "Great job!", emoji: "🔥", color: "text-green-400" };
  if (accuracy >= 60) return { message: "Good effort!", emoji: "👍", color: "text-yellow-500" };
  if (accuracy >= 40) return { message: "Keep practicing!", emoji: "💪", color: "text-orange-500" };
  return { message: "Try again!", emoji: "🔄", color: "text-red-500" };
}
