import { getAccessToken } from "@/lib/auth/session";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { WordBankEntry } from "@/lib/word-bank/types";

const TABLE = "word_bank";

/** All words for the current user, newest first. */
export async function getMyWords(): Promise<WordBankEntry[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select("id, user_id, text, context, meaning, translation, ipa, example, synonyms, image_prompt, audio_url, status, difficulty, error_reason, audio_fetch_attempts, has_audio, ease_factor, interval_days, repetitions, srs_status, next_review_at, last_reviewed_at, review_count, source, source_ref, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as WordBankEntry[];
}

/** Quick-add: POST to API which creates the row + triggers async enrichment. */
export async function quickAddWord(input: {
  text: string;
  context?: string | null;
  deckId?: string | null;
}): Promise<WordBankEntry> {
  const accessToken = await getAccessToken();

  const res = await fetch("/api/words", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      text: input.text,
      context: input.context ?? null,
      deckId: input.deckId ?? null,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }

  const { word } = (await res.json()) as { word: WordBankEntry };
  return word;
}

/** Case-insensitive check whether the current user already has this word. */
export async function isWordInBank(text: string): Promise<boolean> {
  const supabase = getSupabaseBrowserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from(TABLE)
    .select("id")
    .eq("user_id", user.id)
    .ilike("text", text.trim())
    .maybeSingle();

  if (error) throw error;
  return !!data;
}

/** Fetch word bank entries whose source_ref matches any of the given lexicon word ids. */
export async function getWordBankEntriesBySourceRefs(
  sourceRefs: string[]
): Promise<WordBankEntry[]> {
  if (sourceRefs.length === 0) return [];
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select("id, user_id, text, context, meaning, translation, ipa, example, synonyms, image_prompt, audio_url, status, difficulty, error_reason, audio_fetch_attempts, has_audio, ease_factor, interval_days, repetitions, srs_status, next_review_at, last_reviewed_at, review_count, source, source_ref, created_at, updated_at")
    .in("source_ref", sourceRefs);
  if (error) throw error;
  return (data ?? []) as WordBankEntry[];
}

export async function deleteWord(id: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) throw error;
}

export interface LexiconWordInput {
  sourceRef: string;       // lexicon word id
  text: string;
  definition: string;
  example?: string | null;
  ipa?: string | null;
  audioUrl?: string | null;
  difficulty?: number;
}

/**
 * Idempotent "mark learned" from the lexicon.
 *
 * Merge policy:
 *   - Match on (user_id, text) — case-insensitive via lower().
 *   - If already in word_bank: return existing row untouched (no SRS reset, no source overwrite).
 *   - If new: insert with source='lexicon', status='ready', enrichment pre-filled.
 *
 * Returns { entry, alreadyExisted }.
 */
export async function markLexiconWordLearned(
  input: LexiconWordInput
): Promise<{ entry: WordBankEntry; alreadyExisted: boolean }> {
  const supabase = getSupabaseBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Check for existing row by text (case-insensitive) first.
  const { data: existing, error: selectError } = await supabase
    .from(TABLE)
    .select("id, user_id, text, context, meaning, translation, ipa, example, synonyms, image_prompt, audio_url, status, difficulty, error_reason, audio_fetch_attempts, has_audio, ease_factor, interval_days, repetitions, srs_status, next_review_at, last_reviewed_at, review_count, source, source_ref, created_at, updated_at")
    .eq("user_id", user.id)
    .ilike("text", input.text)
    .maybeSingle();

  if (selectError) throw selectError;

  if (existing) {
    return { entry: existing as WordBankEntry, alreadyExisted: true };
  }

  const { data: inserted, error: insertError } = await supabase
    .from(TABLE)
    .insert({
      user_id: user.id,
      text: input.text,
      meaning: input.definition,
      example: input.example ?? null,
      ipa: input.ipa ?? null,
      audio_url: input.audioUrl ?? null,
      difficulty: input.difficulty ?? 0,
      status: "ready",
      source: "lexicon",
      source_ref: input.sourceRef,
    })
    .select("id, user_id, text, context, meaning, translation, ipa, example, synonyms, image_prompt, audio_url, status, difficulty, error_reason, audio_fetch_attempts, has_audio, ease_factor, interval_days, repetitions, srs_status, next_review_at, last_reviewed_at, review_count, source, source_ref, created_at, updated_at")
    .single();

  if (insertError) throw insertError;
  return { entry: inserted as WordBankEntry, alreadyExisted: false };
}

/** Minimal word data for loading animations — only text, ipa, status. */
export async function getReadyWordSummaries(): Promise<{ text: string; ipa: string | null }[]> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from(TABLE)
    .select('text, ipa')
    .eq('status', 'ready')
  if (error) throw error
  return (data ?? []) as { text: string; ipa: string | null }[]
}

/** Toggle the is_favorite flag for a word bank row owned by the current user. */
export async function toggleFavorite(
  wordBankId: string,
  value: boolean
): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase
    .from("word_bank")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({ is_favorite: value } as any)
    .eq("id", wordBankId);
  if (error) throw error;
}

const DAILY_WORD_COLUMNS =
  "id, user_id, text, meaning, translation, ipa, example, audio_url, difficulty, status, srs_status, next_review_at, ease_factor, interval_days, repetitions, review_count, last_reviewed_at, source, source_ref, created_at";

/** Words due or new — used by the daily plan word review step. */
export async function getDueWordsForDaily(
  userId: string,
  limit: number,
): Promise<WordBankEntry[]> {
  const supabase = getSupabaseBrowserClient();
  const today = new Date().toISOString();

  const { data, error } = await supabase
    .from(TABLE)
    .select(DAILY_WORD_COLUMNS)
    .eq("user_id", userId)
    .eq("status", "ready")
    .or(`srs_status.eq.new,next_review_at.lte.${today}`)
    .order("next_review_at", { ascending: true, nullsFirst: true })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as WordBankEntry[];
}

/** New words only — primary source for daily plan word review. */
export async function getNewWordsForDaily(
  userId: string,
  limit: number,
): Promise<WordBankEntry[]> {
  if (limit <= 0) return [];
  const supabase = getSupabaseBrowserClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select(DAILY_WORD_COLUMNS)
    .eq("user_id", userId)
    .eq("status", "ready")
    .eq("srs_status", "new")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as WordBankEntry[];
}

/** SRS-due review words (excludes new) — used by buildReviewPlan. */
export async function getDueReviewWordsForDaily(
  userId: string,
  limit: number,
): Promise<WordBankEntry[]> {
  const supabase = getSupabaseBrowserClient();
  const today = new Date().toISOString();

  const { data, error } = await supabase
    .from(TABLE)
    .select(DAILY_WORD_COLUMNS)
    .eq("user_id", userId)
    .eq("status", "ready")
    .neq("srs_status", "new")
    .lte("next_review_at", today)
    .order("next_review_at", { ascending: true })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as WordBankEntry[];
}

