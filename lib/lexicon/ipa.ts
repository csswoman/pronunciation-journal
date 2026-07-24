import { ARPABET_TO_IPA } from "@/lib/pronunciation/phonemes";

type CmuDict = Record<string, string>;

let dictCache: CmuDict | null = null;

const VOWELS = new Set([
  "AA", "AE", "AH", "AO", "AW", "AY", "EH", "ER", "EY",
  "IH", "IY", "OW", "OY", "UH", "UW",
]);

/**
 * Convert a space-separated ARPAbet string to IPA with lexical stress.
 * Stress marks (ˈ / ˌ) go before the syllable onset.
 * AH0 → ə; keep in sync with scripts/lib/arpabet-to-ipa.mjs.
 */
export function arpabetStringToIpa(arpabet: string): string {
  const phones = arpabet.trim().split(/\s+/).filter(Boolean);
  let out = "";
  let onset = "";

  for (const phone of phones) {
    const stressMatch = phone.match(/(\d)$/);
    const stress = stressMatch ? stressMatch[1] : null;
    const base = phone.replace(/\d$/, "");
    const isVowel = VOWELS.has(base);

    let ipa: string;
    if (base === "AH" && stress === "0") {
      ipa = "ə";
    } else {
      ipa = ARPABET_TO_IPA[base] ?? base.toLowerCase();
    }

    if (isVowel) {
      const mark = stress === "1" ? "ˈ" : stress === "2" ? "ˌ" : "";
      out += mark + onset + ipa;
      onset = "";
    } else {
      onset += ipa;
    }
  }

  return out + onset;
}

function normalizeToken(token: string): string {
  return token.toLowerCase().replace(/[^a-z0-9']/g, "");
}

/**
 * Load the full CMU dictionary synchronously. Node-only — build scripts and
 * Vitest (`validate-core.ts`).
 *
 * NEVER import this, or `lookupIpaFromCmu`, from a client component or from any
 * module a client component reaches. The `require` below is a static dependency,
 * so doing so pulls ~3.7MB (~940KB gzip) of CMUdict eagerly into that route's
 * bundle. `arpabetStringToIpa` above is pure and safe to import anywhere.
 *
 * Client-side phoneme lookups go through `lib/pronunciation/phonemes.ts`, which
 * loads the same dictionary via `await import()` so it stays a lazy chunk.
 * `scripts/analyze-bundle.mjs` reports that chunk separately from the budget and
 * will fail CI if it ever lands in the eager bundle.
 */
export function getCmuDictSync(): CmuDict {
  if (dictCache) return dictCache;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require("cmu-pronouncing-dictionary") as {
    dictionary?: CmuDict;
    default?: CmuDict;
  };
  dictCache = (mod.dictionary ?? mod.default ?? mod) as CmuDict;
  return dictCache;
}

/** Best-effort IPA from CMU; returns null if any token is missing. */
export function lookupIpaFromCmu(word: string, dict?: CmuDict): string | null {
  const d = dict ?? getCmuDictSync();
  const tokens = word.trim().split(/[\s/]+/).filter(Boolean);
  if (tokens.length === 0) return null;

  const syllables: string[] = [];

  for (const raw of tokens) {
    const key = normalizeToken(raw);
    if (!key) continue;

    const entry =
      d[key] ??
      d[key.replace(/-/g, "")] ??
      (key.endsWith("s") && key.length > 3 ? d[key.slice(0, -1)] : undefined);

    if (!entry) return null;
    syllables.push(arpabetStringToIpa(entry));
  }

  if (syllables.length === 0) return null;
  return `/${syllables.join(" ")}/`;
}
