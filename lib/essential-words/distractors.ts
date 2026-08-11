// Distractor selection policy (spec §2.4b). Pool-first: callers pass the
// words the learner has already seen (from useEssentialWordsSession.ts's
// distractorPool, or a larger dataset slice as fallback for early sessions)
// — this module only applies the safety filter, it does not decide where
// the candidate pool comes from.

import type { EssentialWord } from "./types";

/** Minimum edit distance a distractor must be from the target — excludes
 * near-neighbors like be/he, to/do that would test spelling recognition
 * rather than word knowledge. */
const MIN_DISTANCE = 2;

function editDistance(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

function isSafeDistance(target: string, candidate: string): boolean {
  return editDistance(target.toLowerCase(), candidate.toLowerCase()) >= MIN_DISTANCE;
}

function phoneticDistance(target: string, candidate: string): number {
  const targetSymbols = Array.from(target.replace(/[ˈˌ.\s]/g, ''));
  const candidateSymbols = Array.from(candidate.replace(/[ˈˌ.\s]/g, ''));
  return editDistance(targetSymbols.join(''), candidateSymbols.join(''));
}

/**
 * Selects up to `count` distractors for `target` from `pool`, applying (in
 * order, relaxing category first if the strict filter starves the result):
 *   1. never the target itself;
 *   2. never a known homophone (`homophones`, caller-supplied per target);
 *   3. minimum orthographic distance >= 2 from the target;
 *   4. same grammatical category as target (relaxed first if too few remain);
 *   5. deduped by lowercase surface form.
 *
 * Returns fewer than `count` (even zero) when the pool genuinely cannot
 * supply enough safe candidates — callers must handle a short result rather
 * than this function inventing unsafe distractors to fill the quota.
 */
export function selectDistractors(
  target: EssentialWord,
  pool: EssentialWord[],
  homophones: string[],
  count: number,
): EssentialWord[] {
  const homophoneSet = new Set(homophones.map((h) => h.toLowerCase()));
  const targetKey = target.word.toLowerCase();

  const base = pool.filter((w) => {
    const key = w.word.toLowerCase();
    if (key === targetKey) return false;
    if (homophoneSet.has(key)) return false;
    return isSafeDistance(target.word, w.word);
  });

  const dedupe = (candidates: EssentialWord[]): EssentialWord[] => {
    const seen = new Set<string>();
    const out: EssentialWord[] = [];
    for (const c of candidates) {
      const key = c.word.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(c);
      if (out.length === count) break;
    }
    return out;
  };

  const sameCategory = base.filter((w) => w.pos === target.pos);
  const strict = dedupe(sameCategory);
  if (strict.length === count) return strict;

  // Relax category constraint before distance/homophone (spec §2.4b: "mejor
  // mezclar categorías que producir discriminación fina accidental").
  return dedupe(base);
}

/**
 * Chooses alternatives for an audio-recognition exercise. Unlike meaning
 * recognition, this deliberately favours the closest available pronunciations
 * so the learner has to discriminate the sound they heard.
 */
export function selectAudioDistractors(
  target: EssentialWord,
  pool: EssentialWord[],
  count: number,
): EssentialWord[] {
  const targetKey = target.word.toLowerCase();
  const seen = new Set<string>();

  return pool
    .filter((candidate) => {
      const key = candidate.word.toLowerCase();
      if (key === targetKey || seen.has(key) || !candidate.ipa_strong) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => {
      const distance = phoneticDistance(target.ipa_strong, a.ipa_strong)
        - phoneticDistance(target.ipa_strong, b.ipa_strong);
      if (distance !== 0) return distance;
      return a.word.localeCompare(b.word);
    })
    .slice(0, count);
}
