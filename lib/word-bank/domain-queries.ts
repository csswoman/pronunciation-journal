import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { applyFlashcardRating } from "@/lib/word-bank/srs-queries";
import { recordActivitySession } from "@/lib/progress/activity-hub";
import type { SessionResult } from "@/lib/practice/types";

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
 * Records SRS repetition and activity XP for words successfully found in a
 * Word Search puzzle sourced from the user's word_bank.
 */
export async function recordWordSearchRepetition(
  userId: string,
  items: Array<{ id: string; word: string; clue: string }>,
  durationMs: number,
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

  try {
    await recordActivitySession(userId, {
      practiceContext: 'practice',
      source: 'lexicon',
      sessionResult: {
        results: items.map((item) => ({
          exerciseId: `ws-${item.id}`,
          slug: 'identify' as const,
          exerciseTypeId: 11,
          contentId: `word:${item.id}`,
          context: 'practice' as const,
          isCorrect: true,
          score: 100,
          timeMs: Math.round(durationMs / Math.max(items.length, 1)),
          completedAt: new Date(),
        })),
        accuracy: 100,
        totalTimeMs: durationMs,
        bySlug: {} as SessionResult['bySlug'],
      },
      metadata: {
        dailyTargetId: 'word_search_puzzle',
      },
    });
  } catch (sessionErr) {
    console.warn('[recordWordSearchRepetition] recordActivitySession failed', sessionErr);
  }

  return count;
}
