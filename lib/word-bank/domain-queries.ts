import { getSupabaseBrowserClient } from "@/lib/supabase/client";

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
