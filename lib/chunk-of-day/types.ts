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
