import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { WordBankEntry } from "@/lib/word-bank/types";
import { deriveWordProgressSignal } from "@/lib/word-bank/progress-state";

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
    .select("source_ref, srs_status, mastery_provenance, objective_evidence_count, familiarity_status")
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
    .select("source_ref, srs_status, mastery_provenance, objective_evidence_count, familiarity_status")
    .in("source_ref", allIds);

  if (error) throw error;

  const statusByRef = new Map(
    (data ?? [])
      .filter((r) => r.source_ref)
      .map((r) => [r.source_ref as string, deriveWordProgressSignal({
        srs_status: r.srs_status,
        mastery_provenance: r.mastery_provenance,
        objective_evidence_count: r.objective_evidence_count,
        familiarity_status: r.familiarity_status,
      })]),
  );

  const result = new Map<string, { mastered: number; reviewing: number }>();
  for (const [categoryId, ids] of categoryWordIds) {
    let mastered = 0;
    let reviewing = 0;
    for (const id of ids) {
      const status = statusByRef.get(id);
      if (status === "mastered") mastered++;
      else if (status) reviewing++;
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
  verified: number;
  familiar: number;
  legacyMastered: number;
  inProgress: number;
  total: number;
}> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select("srs_status, mastery_provenance, objective_evidence_count, familiarity_status")
    .eq("status", "ready");

  if (error) throw error;

  const rows = data ?? [];
  const signals = rows.map((row) => deriveWordProgressSignal(row));
  const mastered = signals.filter((signal) => signal === "mastered").length;
  const verified = signals.filter((signal) => signal === "objective_evidence").length;
  const familiar = signals.filter((signal) => signal === "familiar").length;
  const legacyMastered = signals.filter((signal) => signal === "legacy_mastered").length;
  const inProgress = rows.filter(
    (_r, index) => signals[index] !== "mastered",
  ).length;

  return {
    mastered,
    verified,
    familiar,
    legacyMastered,
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
    .or(`and(srs_status.neq.new,next_review_at.lte.${today}),verification_due_at.lte.${today}`);

  if (error) throw error;
  return count ?? 0;
}

/** Server-only: count of rows in the current user's word bank. */
export async function countMyWords(userId: string): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const { count, error } = await supabase
    .from(TABLE)
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) throw error;
  return count ?? 0;
}

/** Server-only: count of rows in the current user's decks. */
export async function countUserDecks(userId: string): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const { count, error } = await supabase
    .from("decks")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

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
    .select("id, user_id, text, meaning, translation, ipa, example, audio_url, difficulty, status, srs_status, next_review_at, ease_factor, interval_days, repetitions, review_count, last_reviewed_at, is_favorite, familiarity_status, familiarity_confidence, verification_due_at, mastery_provenance, mastery_version, objective_evidence_count, source, source_ref, created_at")
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
    .select("id, user_id, text, meaning, translation, ipa, example, audio_url, difficulty, status, srs_status, next_review_at, ease_factor, interval_days, repetitions, review_count, last_reviewed_at, is_favorite, familiarity_status, familiarity_confidence, verification_due_at, mastery_provenance, mastery_version, objective_evidence_count, source, source_ref, created_at")
    .eq("user_id", userId)
    .eq("status", "ready")
    .or(`and(srs_status.neq.new,next_review_at.lte.${today}),verification_due_at.lte.${today}`)
    .order("next_review_at", { ascending: true })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as WordBankEntry[];
}
