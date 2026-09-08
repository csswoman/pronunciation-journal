/**
 * Marks a saved item as having come from the AI Coach.
 *
 * Two shapes carry it: `word_bank.source` (a flat column) and
 * `tracked_items.payload.source` (inside the JSON payload). `isFromCoach`
 * accepts either so the Guardadas filter can treat both alike.
 */
export const AI_COACH_SOURCE = "ai_coach";

export function isFromCoach(row: unknown): boolean {
  if (!row || typeof row !== "object") return false;
  const o = row as { source?: unknown; payload?: { source?: unknown } };
  if (o.source === AI_COACH_SOURCE) return true;
  return o.payload?.source === AI_COACH_SOURCE;
}
