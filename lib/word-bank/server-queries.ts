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

/**
 * Server-only: returns a map of categoryId → { mastered, reviewing } counts.
 * categoryWordIds is a map of categoryId → array of lexicon word IDs.
 */
export async function getLexiconProgressByCategory(
  categoryWordIds: Map<string, string[]>,
): Promise<Map<string, { mastered: number; reviewing: number }>> {
  const allIds = Array.from(categoryWordIds.values()).flat();
  if (allIds.length === 0) return new Map();

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select("source_ref, srs_status")
    .in("source_ref", allIds);

  if (error) throw error;

  const statusByRef = new Map(
    (data ?? [])
      .filter((r) => r.source_ref)
      .map((r) => [r.source_ref as string, r.srs_status as string]),
  );

  const result = new Map<string, { mastered: number; reviewing: number }>();
  for (const [categoryId, ids] of categoryWordIds) {
    let mastered = 0;
    let reviewing = 0;
    for (const id of ids) {
      const status = statusByRef.get(id);
      if (status === "mastered") mastered++;
      else if (status === "learning" || status === "review") reviewing++;
    }
    result.set(categoryId, { mastered, reviewing });
  }
  return result;
}

/**
 * Returns a map from lexicon word id → { id: word_bank row id, isFavorite: boolean }
 * for words the current user has in their word_bank.
 */
export async function getLexiconWordBankDetails(
  lexiconIds: string[]
): Promise<Map<string, { id: string; isFavorite: boolean; srsStatus: string | null }>> { // isFavorite always false until types regenerated
  if (lexiconIds.length === 0) return new Map();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select("id, source_ref, srs_status")
    .in("source_ref", lexiconIds);
  if (error) throw error;
  return new Map(
    (data ?? [])
      .filter((r) => r.source_ref)
      .map((r) => [r.source_ref!, { id: r.id, isFavorite: false, srsStatus: r.srs_status as string | null }])
  );
}

/** Server-only: mastered vs in-progress counts for the current user's word bank. */
export async function getVocabularyRetentionStats(): Promise<{
  mastered: number;
  inProgress: number;
  total: number;
}> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select("srs_status")
    .eq("status", "ready");

  if (error) throw error;

  const rows = data ?? [];
  const mastered = rows.filter((r) => r.srs_status === "mastered").length;
  const inProgress = rows.filter(
    (r) => r.srs_status && r.srs_status !== "mastered",
  ).length;

  return {
    mastered,
    inProgress,
    total: rows.length,
  };
}

/** Server-only: count of words due for review today. */
export async function countWordsDueForReview(): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const today = new Date().toISOString();
  const { count, error } = await supabase
    .from(TABLE)
    .select("*", { count: "exact", head: true })
    .eq("status", "ready")
    .neq("srs_status", "new")
    .lte("next_review_at", today);

  if (error) throw error;
  return count ?? 0;
}

/** Server-only: weak words for review hub. */
export async function getWeakWordsForReviewServer(
  userId: string,
  limit = 6,
): Promise<WordBankEntry[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select("id, user_id, text, meaning, translation, ipa, example, audio_url, difficulty, status, srs_status, next_review_at, ease_factor, interval_days, repetitions, review_count, last_reviewed_at, source, source_ref, created_at")
    .eq("user_id", userId)
    .eq("status", "ready")
    .in("srs_status", ["new", "learning"])
    .order("ease_factor", { ascending: true })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as WordBankEntry[];
}

/** Server-only: words due for review today, most urgent first. */
export async function getWordsDueForReview(userId: string, limit = 5): Promise<WordBankEntry[]> {
  const supabase = await createSupabaseServerClient();
  const today = new Date().toISOString();
  const { data, error } = await supabase
    .from(TABLE)
    .select("id, user_id, text, meaning, translation, ipa, example, audio_url, difficulty, status, srs_status, next_review_at, ease_factor, interval_days, repetitions, review_count, last_reviewed_at, source, source_ref, created_at")
    .eq("user_id", userId)
    .eq("status", "ready")
    .neq("srs_status", "new")
    .lte("next_review_at", today)
    .order("next_review_at", { ascending: true })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as WordBankEntry[];
}
