/**
 * Phoneme-level pronunciation analysis using the CMU Pronouncing Dictionary.
 * Dynamic import keeps the ~3.5MB dictionary out of the initial JS bundle.
 */

import type { PhonemeResult, PhonemeAlignment } from "./types";

// ARPAbet → IPA symbol mapping (used to link to the IPA chart)
export const ARPABET_TO_IPA: Record<string, string> = {
  AA: "ɑ",  AE: "æ",  AH: "ʌ",  AO: "ɔ",  AW: "aʊ",
  AY: "aɪ", EH: "ɛ",  ER: "ɜr", EY: "eɪ", IH: "ɪ",
  IY: "iː", OW: "oʊ", OY: "ɔɪ", UH: "ʊ",  UW: "uː",
  B:  "b",  CH: "tʃ", D:  "d",  DH: "ð",  F:  "f",
  G:  "ɡ",  HH: "h",  JH: "dʒ", K:  "k",  L:  "l",
  M:  "m",  N:  "n",  NG: "ŋ",  P:  "p",  R:  "ɹ",
  S:  "s",  SH: "ʃ",  T:  "t",  TH: "θ",  V:  "v",
  W:  "w",  Y:  "j",  Z:  "z",  ZH: "ʒ",
};

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
const phonemeCache = new Map<string, string[]>();

async function getDict(): Promise<Record<string, string>> {
  if (dictCache) return dictCache;
  const mod: { dictionary?: Record<string, string>; default?: Record<string, string> } = await import("cmu-pronouncing-dictionary");
  dictCache = (mod.dictionary ?? mod.default ?? mod) as Record<string, string>;
  return dictCache;
}

function normalizeWordForLookup(word: string): string {
  return word.toLowerCase().replace(/[^a-z']/g, "");
}

async function phonemesFor(word: string): Promise<string[]> {
  const normalized = normalizeWordForLookup(word);
  if (!normalized) return [];

  const cached = phonemeCache.get(normalized);
  if (cached) return cached;

  const dict = await getDict();
  const entry = dict[normalized];
  const result = entry ? entry.split(" ") : [];
  phonemeCache.set(normalized, result);
  return result;
}

function ipaLabel(p: string): string {
  const ipa = ARPABET_TO_IPA[stripStress(p)];
  return ipa ? `/${ipa}/` : label(p);
}

function buildTip(expected: string[], got: string[]): string | null {
  if (expected.length === 0) return null;
  if (got.length === 0) return `Focus on: ${expected.map(ipaLabel).join(" ")}`;

  for (let i = 0; i < Math.max(expected.length, got.length); i++) {
    const e = expected[i];
    const g = got[i];
    if (!e) return `Extra sound at the end — stop after ${ipaLabel(expected[expected.length - 1])}`;
    if (!g) return `Don't drop the ${ipaLabel(e)} sound`;
    if (stripStress(e) !== stripStress(g)) {
      return `Say ${ipaLabel(e)} not ${ipaLabel(g)} — ${label(e)}`;
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
        const exp = stripStress(expected[i - 1]);
        const g = stripStress(got[j - 1]);
        result.unshift(
          sub === 0
            ? { phoneme: exp, ipa: ARPABET_TO_IPA[exp], status: "correct" }
            : { phoneme: exp, ipa: ARPABET_TO_IPA[exp], status: "incorrect", got: g, gotIpa: ARPABET_TO_IPA[g] }
        );
        i--; j--;
        continue;
      }
    }
    if (i > 0 && (j === 0 || dp[i][j] === dp[i - 1][j] + 1)) {
      const exp = stripStress(expected[i - 1]);
      result.unshift({ phoneme: exp, ipa: ARPABET_TO_IPA[exp], status: "missing" });
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

export async function warmupPhonemeEngine(words: string[]): Promise<void> {
  await getDict();
  const uniqueWords = Array.from(new Set(words.map(normalizeWordForLookup).filter(Boolean)));
  await Promise.all(uniqueWords.map((w) => phonemesFor(w)));
}
