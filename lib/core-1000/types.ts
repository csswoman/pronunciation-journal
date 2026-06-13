/** Core 1000 word entry — authored JSON in public/core-1000/, validated by ./schema. */

export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1";

export const CORE_POS = [
  "noun",
  "verb",
  "adjective",
  "adverb",
  "pronoun",
  "preposition",
  "conjunction",
  "determiner",
  "article",
  "modal",
  "auxiliary",
  "number",
  "interjection",
] as const;
export type CorePos = (typeof CORE_POS)[number];

export interface CoreWord {
  rank: number; // 1–1000, único, contiguo por chunk
  word: string;
  pos: CorePos;
  ipa_strong: string; // General American, con marcas de stress
  ipa_weak?: string; // solo function words (whitelist en ./weak-forms)
  example_sentence: string; // contiene la palabra; ahí vive la weak form
  sentence_ipa?: string; // obligatorio si hay ipa_weak (Zod refine)
  cefr_level: CefrLevel;
}

export const CORE1000_PREFIX = "c1k:";
export const NEW_CARDS_PER_DAY = 10;
export const CHUNK_SIZE = 100;
export const MAX_CHUNKS = 28;

export function hasReduction(entry: CoreWord): boolean {
  return entry.ipa_weak != null;
}

/** wordId de srsData para una palabra del Core 1000 (namespaced, lowercase). */
export function core1000WordId(word: string): string {
  return `${CORE1000_PREFIX}${word.toLowerCase()}`;
}
