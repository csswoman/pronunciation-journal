/**
 * Shared typographic scale for the hero term in the "Frase del día" and
 * "Palabra del día" home cards. The size is a function of how many words the
 * term contains so both cards stay visually consistent — neither card sets its
 * own size.
 *
 * - 1 word        → text-3xl
 * - 2 to 3 words  → text-2xl
 * - 4+ words      → text-xl sm:text-2xl
 */
export function getHeroScale(term: string): string {
  const wordCount = term.trim().split(/\s+/).filter(Boolean).length;
  if (wordCount <= 1) return "text-3xl";
  if (wordCount <= 3) return "text-2xl";
  return "text-xl sm:text-2xl";
}

