// Small closed lookup for the OPTIONAL "why" explanation shown on failure
// (spec §2.5, point 3: "explicar solo cuando hay regla"). Most words —
// especially concrete nouns — get no explanation, because there is nothing
// to explain; a generic message there is noise, not help. This table only
// grows when a word has a genuine grammatical rule worth stating in one
// short sentence.

const EXPLANATIONS: Record<string, string> = {
  be: "cambia a am / is / are según el sujeto",
  have: "cambia a has con he/she/it",
  do: "cambia a does con he/she/it",
  go: "cambia a goes con he/she/it",
};

/** Returns the explanation string for `word`, or undefined when none exists
 * — callers must treat undefined as "show nothing", never a fallback message. */
export function explanationFor(word: string): string | undefined {
  return EXPLANATIONS[word.trim().toLowerCase()];
}
