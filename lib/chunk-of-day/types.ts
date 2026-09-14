/** A single line of a dialogue example: English utterance + Spanish gloss. */
export interface DialogueTurn {
  en: string;
  es: string;
}

/**
 * The example shown under a term.
 *
 * - `sentence`: one standalone sentence with its translation. Used for single
 *   words, where a full sentence is the natural illustration.
 * - `dialogue`: a short exchange (two turns) that places the term as a reply in
 *   context. Used for phrases, where echoing the phrase inside one sentence
 *   makes its translation redundant with the main translation.
 */
export type Example =
  | { kind: "sentence"; en: string; es: string }
  | { kind: "dialogue"; turns: DialogueTurn[] };

export interface ChunkItem {
  id: string;
  chunk: string;
  ipa: string;
  meaning: string;
  example: string;
  example_translation?: string;
  /**
   * Optional structured two-turn dialogue for this phrase. When present the card
   * renders it instead of the flat `example` string. Populate this in
   * `lib/chunk-of-day/data.ts`; entries without it fall back to a `sentence`
   * example built from `example` / `example_translation`.
   */
  example_dialogue?: DialogueTurn[];
  category: string;
  tag?: string;
  tip?: string;
}

export type ChunkPatternType = "fixed" | "semi_fixed" | "frame";
export type ChunkRegister = "neutral" | "informal" | "formal";

export interface ChunkSlot {
  id: string;
  promptEs: string;
  exampleValues: string[];
}

export interface ChunkLearningMetadata {
  cefr: import("@/lib/exercises/cefr").CEFRLevel;
  communicativeFunction: string;
  secondaryFunctions: string[];
  register: ChunkRegister;
  patternType: ChunkPatternType;
  coreText: string;
  template: string | null;
  slots: ChunkSlot[];
  acceptedAnswers: string[];
  recognitionCueEs: string;
  productionCueEs: string;
  practiceAnswer: string;
  confidence: "low" | "medium" | "high";
  reviewFlags: string[];
}

export type ChunkAnchorOwner = "essential_words" | "word_bank";

/** Stable reference to a word that is visible inside an authored chunk. */
export interface ChunkWordAnchor {
  owner: ChunkAnchorOwner;
  /** `c1k:<word>` for Essential Words or a real `word_bank` UUID. */
  id: string;
}

/** End-exclusive character range derived from `**focus**` authoring markup. */
export interface ChunkTextHighlight {
  start: number;
  end: number;
}

/** Optional authored bridge from a chunk to words and pronunciation targets. */
export interface ChunkContentGraphEntry {
  chunkId: string;
  /** `**focus**` markup. The compiled text must equal the visible chunk. */
  markedText: string;
  /** One stable reference for each marked range, in source order. */
  anchors: ChunkWordAnchor[];
  pronunciationTargetIds?: string[];
}

/** Runtime-safe form of an authored content graph entry. */
export interface ResolvedChunkContentGraph {
  text: string;
  highlights: ChunkTextHighlight[];
  anchors: ChunkWordAnchor[];
  pronunciationTargetIds: string[];
}

export interface LearningChunk extends ChunkItem {
  learning: ChunkLearningMetadata;
  /** Empty arrays preserve the explicit legacy fallback for unlinked content. */
  contentGraph: ResolvedChunkContentGraph;
}

/** Build the `Example` a phrase card should render from its chunk entry. */
export function chunkExample(chunk: ChunkItem): Example | null {
  if (chunk.example_dialogue && chunk.example_dialogue.length > 0) {
    return { kind: "dialogue", turns: chunk.example_dialogue };
  }
  if (chunk.example) {
    return {
      kind: "sentence",
      en: chunk.example,
      es: chunk.example_translation ?? "",
    };
  }
  return null;
}
