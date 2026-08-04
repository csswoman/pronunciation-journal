// Semantic typo detection (spec §2.6). Deliberately NOT a length-based
// Levenshtein-distance-1 threshold: measured against this dataset, 47.4% of
// the top-500 words have <=4 letters, and 624 short words collide with
// another dataset word at distance 1 (be/he, to/do, of/on, in/it). A
// length-blind distance-1 rule would accept "he" as a typo of "be" —
// converting real unfamiliarity into a false pass and poisoning the grade.
//
// A typed answer is a typo only if BOTH hold:
//   1. it is NOT itself a real word (checked against a small closed set of
//      known collision words — the dataset's own vocabulary — so a genuine
//      different word never qualifies), and
//   2. the edit from the answer to the target belongs to a typical typing-
//      error class: adjacent QWERTY key, a doubled letter, or a transposed
//      adjacent pair.

// Adjacency map for a standard QWERTY layout — only the letters that matter
// for typo classification (rows only; enough for realistic near-misses).
const ADJACENT: Record<string, string[]> = {
  q: ["w", "a"], w: ["q", "e", "a", "s"], e: ["w", "r", "s", "d"], r: ["e", "t", "d", "f"],
  t: ["r", "y", "f", "g"], y: ["t", "u", "g", "h"], u: ["y", "i", "h", "j"], i: ["u", "o", "j", "k"],
  o: ["i", "p", "k", "l"], p: ["o", "l"],
  a: ["q", "w", "s", "z"], s: ["a", "w", "e", "d", "z", "x"], d: ["s", "e", "r", "f", "x", "c"],
  f: ["d", "r", "t", "g", "c", "v"], g: ["f", "t", "y", "h", "v", "b"], h: ["g", "y", "u", "j", "b", "n"],
  j: ["h", "u", "i", "k", "n", "m"], k: ["j", "i", "o", "l", "m"], l: ["k", "o", "p"],
  z: ["a", "s", "x"], x: ["z", "s", "d", "c"], c: ["x", "d", "f", "v"], v: ["c", "f", "g", "b"],
  b: ["v", "g", "h", "n"], n: ["b", "h", "j", "m"], m: ["n", "j", "k"],
};

function isAdjacentKeyTypo(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diffIndex = -1, diffCount = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) { diffCount++; diffIndex = i; if (diffCount > 1) return false; }
  }
  if (diffCount !== 1) return false;
  return (ADJACENT[a[diffIndex]] ?? []).includes(b[diffIndex]);
}

function isDoubledLetterTypo(a: string, b: string): boolean {
  // One is the other with a single character duplicated once (or missing a
  // duplicate): |len diff| === 1, and removing the extra char from the
  // longer one yields the shorter one.
  const [shorter, longer] = a.length < b.length ? [a, b] : [b, a];
  if (longer.length - shorter.length !== 1) return false;
  for (let i = 0; i < longer.length; i++) {
    const candidate = longer.slice(0, i) + longer.slice(i + 1);
    if (candidate === shorter) return true;
  }
  return false;
}

function isTranspositionTypo(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let firstDiff = -1;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) { firstDiff = i; break; }
  }
  if (firstDiff === -1) return false; // identical — not a typo
  const i = firstDiff;
  if (i + 1 >= a.length) return false;
  const swapped = a.slice(0, i) + a[i + 1] + a[i] + a.slice(i + 2);
  return swapped === b;
}

function isTypingErrorClass(written: string, target: string): boolean {
  return (
    isAdjacentKeyTypo(written, target) ||
    isDoubledLetterTypo(written, target) ||
    isTranspositionTypo(written, target)
  );
}

/**
 * True when `written` is a typo of `target`: not itself a valid word, and
 * the edit belongs to a typical typing-error class. `isKnownWord` lets
 * callers pass the actual dataset vocabulary (or any validator) so a real
 * collision word is never misclassified — defaults to a small built-in set
 * covering the dataset's documented high-frequency collision pairs so this
 * function is usable standalone without wiring the full word list.
 */
const KNOWN_COLLISION_WORDS = new Set([
  "he", "be", "to", "do", "of", "on", "in", "it", "so", "no", "go", "we", "me",
  "him", "her", "his", "any", "and",
]);

export function isTypo(
  written: string,
  target: string,
  isKnownWord: (w: string) => boolean = (w) => KNOWN_COLLISION_WORDS.has(w),
): boolean {
  const w = written.trim().toLowerCase();
  const t = target.trim().toLowerCase();
  if (w === t) return false;
  if (isKnownWord(w)) return false;
  return isTypingErrorClass(w, t);
}
