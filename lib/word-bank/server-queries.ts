import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { WordBankEntry } from "@/lib/word-bank/types";

const TABLE = "word_bank";

/**
 * Server-only: returns the set of lexicon source_refs (word ids) that the
 * current user already has in their word_bank. Used to render the correct
 * initial button state on the lexicon lesson page.
 */
export async function getLexiconWordBankSet(lexiconWordIds: string[]): Promise<Set<string>> {
  if (lexiconWordIds.length === 0) return new Set();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select("source_ref")
    .in("source_ref", lexiconWordIds);

  if (error) throw error;
  return new Set((data ?? []).map((r) => r.source_ref).filter(Boolean) as string[]);
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
