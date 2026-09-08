import type { TurnSaveable } from "@/lib/ai-practice/tools/registry";
import { quickAddWord, toggleFavorite, DuplicateWordError } from "@/lib/word-bank/queries";
import { saveTrackedItem } from "@/lib/tracking/queries";
import { AI_COACH_SOURCE } from "./source";

/** Stable idempotency key for an explanation: lowercase, trimmed, single-spaced. */
function slug(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, " ");
}

/**
 * Routes one coach-proposed item to the store it belongs in, so it inherits
 * the review machinery that already exists rather than living in a side table.
 *
 * - `word`  → word_bank, favourited (Guardadas lists favourites only)
 * - `phrase`→ tracked_items, which the outbox syncs to Supabase
 *
 * Offline is fine: quickAddWord fails loudly (the chip offers a retry) and
 * saveTrackedItem writes to Dexie and queues the upsert.
 */
export async function persistSaveable(userId: string, saveable: TurnSaveable): Promise<void> {
  if (saveable.type === "phrase") {
    await saveTrackedItem({
      userId,
      kind: "phrase",
      ref: saveable.text.toLocaleLowerCase(),
      title: saveable.text,
      payload: {
        text: saveable.text,
        meaning: saveable.meaning,
        source: AI_COACH_SOURCE,
      },
    });
    return;
  }

  try {
    const word = await quickAddWord({
      text: saveable.text,
      ...(saveable.example ? { context: saveable.example } : {}),
      source: AI_COACH_SOURCE,
    });
    await toggleFavorite(word.id, true);
  } catch (err) {
    // Saving a word the learner already has is a success from their point of
    // view — they wanted it in Guardadas, so favourite the existing row.
    if (err instanceof DuplicateWordError) {
      await toggleFavorite(err.wordId, true);
      return;
    }
    throw err;
  }
}

/**
 * Saves a coach explanation as a reference note in Guardadas. `body` is the
 * coach message's rendered prose; `title` is the short label the coach gave it.
 * Idempotent per (user, title): re-saving updates the existing row.
 */
export async function persistConcept(userId: string, title: string, body: string): Promise<void> {
  await saveTrackedItem({
    userId,
    kind: "explanation",
    ref: slug(title),
    title,
    payload: { body, source: AI_COACH_SOURCE },
  });
}
