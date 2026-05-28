import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { WordBankEntry } from "@/lib/word-bank/types";

const TABLE = "word_bank";

/**
 * Server-only: returns a map of lexicon source_ref → srs_status for words the
 * current user has in their word_bank. Used to render learned/reviewing/new
 * status on the lexicon lesson page.
 */
export async function getLexiconWordBankMap(
  lexiconWordIds: string[],
): Promise<Map<string, string>> {
  if (lexiconWordIds.length === 0) return new Map();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select("source_ref, srs_status")
    .in("source_ref", lexiconWordIds);

  if (error) throw error;
  return new Map(
    (data ?? [])
      .filter((r) => r.source_ref)
      .map((r) => [r.source_ref as string, r.srs_status as string]),
  );
}

/** Server-only: words due for review today, most urgent first. */
export async function getWordsDueForReview(limit = 5): Promise<WordBankEntry[]> {
  const supabase = await createSupabaseServerClient();
  const today = new Date().toISOString();
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("status", "ready")
    .or(`srs_status.eq.new,next_review_at.lte.${today}`)
    .order("next_review_at", { ascending: true, nullsFirst: true })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as WordBankEntry[];
}
