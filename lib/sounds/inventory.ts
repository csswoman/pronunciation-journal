import { PHONEMES, type PhonemeData } from "@/components/ipa/data";
import { formatIpaDisplay } from "@/lib/lexicon/format-ipa";

export type SoundClass = PhonemeData["type"];

export const SOUND_CLASS_LABELS: Record<SoundClass, string> = {
  vowel: "Vocales",
  consonant: "Consonantes",
  diphthong: "Diptongos",
};

export const SOUND_CLASS_SINGULAR_LABELS: Record<SoundClass, string> = {
  vowel: "Vocal",
  consonant: "Consonante",
  diphthong: "Diptongo",
};

/**
 * Canonical inventory for every learner-facing sound surface.
 *
 * The IPA chart is the authoritative General American inventory. Database
 * rows enrich these definitions with words and SRS-compatible IDs, but they
 * do not define how many sounds the product teaches.
 */
export const CANONICAL_SOUNDS = PHONEMES;
export const CANONICAL_SOUND_COUNT = CANONICAL_SOUNDS.length;

const SOUND_BY_IPA = new Map(
  CANONICAL_SOUNDS.map((phoneme) => [phoneme.symbol, phoneme] as const),
);

/** Legacy/duplicate database glyph that normalizes to the canonical /g/. */
const IPA_ALIASES: Record<string, string> = {
  "/ɡ/": "/g/",
};

/** Stored spellings to include when querying a canonical sound. */
export function getSoundIpaCandidates(ipa: string): string[] {
  const canonicalIpa = canonicalizeSoundIpa(ipa);
  return [
    canonicalIpa,
    ...Object.entries(IPA_ALIASES)
      .filter(([, target]) => target === canonicalIpa)
      .map(([alias]) => alias),
  ].filter((value, index, values) => values.indexOf(value) === index);
}

/** Normalize stored IPA before matching it against the canonical inventory. */
export function canonicalizeSoundIpa(ipa: string): string {
  const display = formatIpaDisplay(ipa);
  return IPA_ALIASES[display] ?? display;
}

export function getCanonicalSound(ipa: string): PhonemeData | undefined {
  return SOUND_BY_IPA.get(canonicalizeSoundIpa(ipa));
}

export function isCanonicalSoundIpa(ipa: string): boolean {
  return getCanonicalSound(ipa) !== undefined;
}
