import { CHUNK_SIZE, MAX_CHUNKS } from "@/lib/core-1000/types";
import { listAllDecks } from "@/lib/courses/grammar-deck/decks";

const ESSENTIAL_WORDS_TOTAL = MAX_CHUNKS * CHUNK_SIZE;

let cachedTotal: number | null = null;

/**
 * Approximate learnable vocabulary across active practice paths
 * (Essential Words + grammar study decks). Lexicon is reference-only.
 */
export function getAppVocabularyCatalogTotal(): number {
  if (cachedTotal != null) return cachedTotal;
  const grammarCards = listAllDecks().reduce((sum, deck) => sum + deck.cardCount, 0);
  cachedTotal = ESSENTIAL_WORDS_TOTAL + grammarCards;
  return cachedTotal;
}
