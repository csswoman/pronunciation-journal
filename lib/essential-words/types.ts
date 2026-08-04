/** Essential Words entry — authored JSON in public/essential-words/, validated by ./schema. */

export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1";

/** CEFR levels present in the Essential Words dataset, ordered easiest → hardest. */
export const CEFR_LEVELS: readonly CefrLevel[] = ["A1", "A2", "B1", "B2", "C1"] as const;

export const ESSENTIAL_WORD_POS = [
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
export type EssentialWordPos = (typeof ESSENTIAL_WORD_POS)[number];

/**
 * One example sentence plus its IPA. The entry's own `example_sentence` /
 * `sentence_ipa` is variant 0 and stays mandatory; this array holds the
 * *additional* sentences, so a word with no variants behaves as before.
 */
export interface SentenceVariant {
  sentence: string;
  sentence_ipa: string;
}

export interface EssentialWord {
  rank: number; // 1–2800, único, contiguo por chunk
  word: string;
  pos: EssentialWordPos;
  ipa_strong: string; // General American, con marcas de stress
  ipa_weak?: string; // solo function words (whitelist en ./weak-forms)
  example_sentence: string; // contiene la palabra; ahí vive la weak form
  sentence_ipa?: string; // obligatorio si hay ipa_weak (Zod refine)
  cefr_level: CefrLevel;
  meaning?: string; // definición corta en inglés (backfill-meaning)
  translation?: string; // traducción al español (backfill-meaning)
  example_sentences?: SentenceVariant[]; // extra sentences beyond example_sentence
}

export const ESSENTIAL_WORD_PREFIX = "c1k:";
export const NEW_CARDS_PER_DAY = 10;
export const CHUNK_SIZE = 100;
export const MAX_CHUNKS = 28;

export function hasReduction(entry: EssentialWord): boolean {
  return entry.ipa_weak != null;
}

/** wordId de srsData para una palabra de Essential Words (namespaced, lowercase). */
export function essentialWordId(word: string): string {
  return `${ESSENTIAL_WORD_PREFIX}${word.toLowerCase()}`;
}
