import { ARPABET_TO_IPA } from "@/lib/pronunciation/phonemes";

type CmuDict = Record<string, string>;

let dictCache: CmuDict | null = null;

function stripStress(phoneme: string): string {
  return phoneme.replace(/\d$/, "");
}

function arpabetStringToIpa(arpabet: string): string {
  return arpabet
    .split(" ")
    .map((p) => ARPABET_TO_IPA[stripStress(p)] ?? stripStress(p).toLowerCase())
    .join("");
}

function normalizeToken(token: string): string {
  return token.toLowerCase().replace(/[^a-z0-9']/g, "");
}

/** Load CMU dictionary (Node / scripts). */
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
