/**
 * Phoneme-level pronunciation analysis using the CMU Pronouncing Dictionary.
 * Dynamic import keeps the ~3.5MB dictionary out of the initial JS bundle.
 */

import type { PhonemeResult, PhonemeAlignment } from "./types";

// ARPAbet phoneme → friendly description
const PHONEME_LABELS: Record<string, string> = {
  AA: "'a' as in father",  AE: "'a' as in cat",    AH: "'u' as in but",
  AO: "'o' as in law",     AW: "'ow' as in cow",   AY: "'i' as in bite",
  EH: "'e' as in bet",     ER: "'ur' as in bird",  EY: "'a' as in bake",
  IH: "'i' as in bit",     IY: "'ee' as in beet",  OW: "'o' as in boat",
  OY: "'oy' as in boy",    UH: "'u' as in book",   UW: "'oo' as in boot",
  B:  "'b'",   CH: "'ch' as in cheese",   D:  "'d'",
  DH: "'th' as in the",    F:  "'f'",               G:  "'g'",
  HH: "'h'",   JH: "'j' as in jump",     K:  "'k'",
  L:  "'l'",   M:  "'m'",                N:  "'n'",
  NG: "'ng' as in sing",   P:  "'p'",               R:  "'r'",
  S:  "'s'",   SH: "'sh' as in shoe",    T:  "'t'",
  TH: "'th' as in think",  V:  "'v'",               W:  "'w'",
  Y:  "'y'",   Z:  "'z'",               ZH: "'si' as in vision",
};

function stripStress(phoneme: string): string {
  return phoneme.replace(/\d$/, "");
}

function label(p: string): string {
  return PHONEME_LABELS[stripStress(p)] ?? `"${p.toLowerCase()}"`;
}

// Lazy-loaded dictionary singleton
let dictCache: Record<string, string> | null = null;

async function getDict(): Promise<Record<string, string>> {
  if (dictCache) return dictCache;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mod: any = await import("cmu-pronouncing-dictionary");
  dictCache = (mod.dictionary ?? mod.default ?? mod) as Record<string, string>;
  return dictCache;
}

async function phonemesFor(word: string): Promise<string[]> {
  const dict = await getDict();
  const entry = dict[word.toLowerCase().replace(/[^a-z']/g, "")];
  if (!entry) return [];
  return entry.split(" ");
}

function buildTip(expected: string[], got: string[]): string | null {
  if (expected.length === 0) return null;
  if (got.length === 0) return `Focus on pronouncing: ${expected.map(label).join(", ")}`;

  for (let i = 0; i < Math.max(expected.length, got.length); i++) {
    const e = expected[i];
    const g = got[i];
    if (!e) return `You added an extra sound at the end`;
    if (!g) return `Don't drop the ${label(e)} sound at the end`;
    if (stripStress(e) !== stripStress(g)) {
      return `Expected ${label(e)}, but you said ${label(g)}`;
    }
  }
  return null;
}

function buildAlignment(expected: string[], got: string[]): PhonemeAlignment[] {
  const m = expected.length;
  const n = got.length;

  if (m === 0) return [];
  if (n === 0) return expected.map((p) => ({ phoneme: stripStress(p), status: "missing" as const }));

  // Edit-distance DP with traceback — handles insertions/deletions correctly
  // e.g. "world" W ER L D  vs  "word" W ER D  →  W✓ ER✓ L(missing) D✓
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const sub = stripStress(expected[i - 1]) === stripStress(got[j - 1]) ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j - 1] + sub, // match / substitute
        dp[i - 1][j] + 1,       // expected phoneme missing
        dp[i][j - 1] + 1,       // extra phoneme in got (ignored in output)
      );
    }
  }

  // Backtrack to produce alignment
  const result: PhonemeAlignment[] = [];
  let i = m, j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0) {
      const sub = stripStress(expected[i - 1]) === stripStress(got[j - 1]) ? 0 : 1;
      if (dp[i][j] === dp[i - 1][j - 1] + sub) {
        result.unshift(
          sub === 0
            ? { phoneme: stripStress(expected[i - 1]), status: "correct" }
            : { phoneme: stripStress(expected[i - 1]), status: "incorrect", got: stripStress(got[j - 1]) }
        );
        i--; j--;
        continue;
      }
    }
    if (i > 0 && (j === 0 || dp[i][j] === dp[i - 1][j] + 1)) {
      result.unshift({ phoneme: stripStress(expected[i - 1]), status: "missing" });
      i--;
    } else {
      j--; // extra phoneme in got — omit from display
    }
  }

  return result;
}

export async function analyzePhonemes(
  targetWord: string,
  heardWord: string
): Promise<PhonemeResult> {
  const [expected, got] = await Promise.all([
    phonemesFor(targetWord),
    phonemesFor(heardWord),
  ]);
  return {
    expected,
    got,
    tip: buildTip(expected, got),
    alignment: buildAlignment(expected, got),
  };
}
