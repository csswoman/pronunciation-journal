/**
 * Some connector phrases are open-ended: "Anyway,..." / "By the way,...".
 * The trailing "..." (or "…") reads like CSS text-truncation. Split it off so
 * the card can render the gap as an explicit muted slot instead of ellipsis.
 */
const TRAILING_GAP = /\s*(\.{3}|…)\s*$/;

export interface OpenEndedTerm {
  /** The term with any trailing "..." / "…" removed. */
  text: string;
  /** True when the original ended in an open-ended gap. */
  hasGap: boolean;
}

export function splitOpenEnded(term: string): OpenEndedTerm {
  const hasGap = TRAILING_GAP.test(term);
  return {
    text: hasGap ? term.replace(TRAILING_GAP, "") : term,
    hasGap,
  };
}
