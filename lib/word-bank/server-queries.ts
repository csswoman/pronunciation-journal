import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { WordBankEntry } from "@/lib/word-bank/types";

const TABLE = "word_bank";

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
