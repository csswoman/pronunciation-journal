import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { applyFlashcardRating } from "@/lib/word-bank/srs-queries";

const TABLE = "word_bank";

/**
 * Lightweight read for domain-profile derivation (see lib/lexicon/domain-profile.ts):
 * just enough to resolve which lexicon categories a user's saved words came
 * from, without pulling the full row shape lib/word-bank/queries.ts#getMyWords does.
 */
export async function getWordBankSourceRefs(
  userId: string
): Promise<Array<{ source: string | null; source_ref: string | null }>> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select("source, source_ref")
    .eq("user_id", userId)
    .eq("source", "lexicon");
  if (error) throw error;
  return data ?? [];
}

/**
 * Records SRS repetition for words successfully found in a Word Search puzzle
 * sourced from the user's word_bank. The game session itself is logged by the
 * Word Search surface, including puzzles from every source.
 */
export async function recordWordSearchRepetition(
  userId: string,
  items: Array<{ id: string; word: string; clue: string }>,
): Promise<number> {
  let count = 0;
  for (const item of items) {
    try {
      await applyFlashcardRating(
        userId,
        {
          sourceRef: item.id,
          text: item.word,
          definition: item.clue,
        },
        'normal',
      );
      count += 1;
    } catch (err) {
      console.warn('[recordWordSearchRepetition] failed for word', item.word, err);
    }
  }

  return count;
}
