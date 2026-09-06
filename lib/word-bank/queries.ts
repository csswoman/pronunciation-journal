import { getAccessToken } from "@/lib/auth/session";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { WordBankEntry, WordEnrichment, WordPreview } from "@/lib/word-bank/types";

const TABLE = "word_bank";

/** All words for the current user, newest first. */
export async function getMyWords(): Promise<WordBankEntry[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select("id, user_id, text, context, meaning, translation, ipa, example, synonyms, image_prompt, audio_url, status, difficulty, error_reason, audio_fetch_attempts, has_audio, ease_factor, interval_days, repetitions, srs_status, next_review_at, last_reviewed_at, review_count, is_favorite, familiarity_status, familiarity_confidence, verification_due_at, mastery_provenance, mastery_version, objective_evidence_count, source, source_ref, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as WordBankEntry[];
}

/**
 * Thrown when the user already has this word saved. Carries the existing row's
 * id so the caller can offer to edit it instead of creating a duplicate.
 */
export class DuplicateWordError extends Error {
  constructor(readonly wordId: string, readonly text: string) {
    super(`Word already saved: ${text}`);
    this.name = "DuplicateWordError";
  }
}

/** Quick-add: POST to API which creates the row + queues async enrichment. */
export async function quickAddWord(input: {
  text: string;
  context?: string | null;
  deckId?: string | null;
  source?: "manual" | "reader" | "journal" | "ai_coach";
  enrichment?: WordEnrichment;
}): Promise<WordBankEntry> {
  const accessToken = await getAccessToken();

  const res = await fetch("/api/words", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    // Omit null optionals — Zod .optional() rejects null (e.g. deckId: null → 400).
    body: JSON.stringify({
      text: input.text,
      source: input.source ?? "manual",
      ...(input.context != null ? { context: input.context } : {}),
      ...(input.deckId != null ? { deckId: input.deckId } : {}),
      ...(input.enrichment ? { enrichment: input.enrichment } : {}),
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    if (res.status === 409 && err.code === "duplicate_word") {
      throw new DuplicateWordError(err.wordId as string, err.text as string);
    }
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }

  const { word } = (await res.json()) as { word: WordBankEntry };
  return word;
}

/** Fetches the same lexical data Reader will persist if the learner saves it. */
export async function previewWord(text: string): Promise<WordPreview> {
  const accessToken = await getAccessToken();
  const res = await fetch("/api/words/preview", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }

  return await res.json() as WordPreview;
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
    .select("id, user_id, text, context, meaning, translation, ipa, example, synonyms, image_prompt, audio_url, status, difficulty, error_reason, audio_fetch_attempts, has_audio, ease_factor, interval_days, repetitions, srs_status, next_review_at, last_reviewed_at, review_count, is_favorite, familiarity_status, familiarity_confidence, verification_due_at, mastery_provenance, mastery_version, objective_evidence_count, source, source_ref, created_at, updated_at")
    .in("source_ref", sourceRefs);
  if (error) throw error;
  return (data ?? []) as WordBankEntry[];
}

export async function deleteWord(id: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) throw error;
}

export interface WordDetailsUpdate {
  text: string;
  ipa: string | null;
  translation: string | null;
  meaning: string | null;
  context: string | null;
}

/** Update learner-authored details without resetting the word's SRS or source. */
export async function updateWordDetails(id: string, input: WordDetailsUpdate): Promise<WordBankEntry> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from(TABLE)
    .update(input)
    .eq("id", id)
    .select("id, user_id, text, context, meaning, translation, ipa, example, synonyms, image_prompt, audio_url, status, difficulty, error_reason, audio_fetch_attempts, has_audio, ease_factor, interval_days, repetitions, srs_status, next_review_at, last_reviewed_at, review_count, is_favorite, familiarity_status, familiarity_confidence, verification_due_at, mastery_provenance, mastery_version, objective_evidence_count, source, source_ref, created_at, updated_at")
    .single();
  if (error) throw error;
  return data as WordBankEntry;
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
    .select("id, user_id, text, context, meaning, translation, ipa, example, synonyms, image_prompt, audio_url, status, difficulty, error_reason, audio_fetch_attempts, has_audio, ease_factor, interval_days, repetitions, srs_status, next_review_at, last_reviewed_at, review_count, is_favorite, familiarity_status, familiarity_confidence, verification_due_at, mastery_provenance, mastery_version, objective_evidence_count, source, source_ref, created_at, updated_at")
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
    .update({ is_favorite: value })
    .eq("id", wordBankId);
  if (error) throw error;
}

const DAILY_WORD_COLUMNS =
  "id, user_id, text, meaning, translation, ipa, example, audio_url, difficulty, status, srs_status, next_review_at, ease_factor, interval_days, repetitions, review_count, last_reviewed_at, is_favorite, familiarity_status, familiarity_confidence, verification_due_at, mastery_provenance, mastery_version, objective_evidence_count, source, source_ref, created_at";

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
    .or(`srs_status.eq.new,next_review_at.lte.${today},verification_due_at.lte.${today}`)
    .order("next_review_at", { ascending: true, nullsFirst: true })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as WordBankEntry[];
}

/** Saved/familiar tiebreak candidates for the daily plan. Due SRS items are
 * selected separately and always win this small quota. */
export async function getSavedOrFamiliarWordsForDaily(
  userId: string,
  limit: number,
): Promise<WordBankEntry[]> {
  if (limit <= 0) return [];
  try {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from(TABLE)
      .select(DAILY_WORD_COLUMNS)
      .eq("user_id", userId)
      .eq("status", "ready")
      .or("is_favorite.eq.true,familiarity_status.eq.familiar")
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (error) return [];
    return (data ?? []) as WordBankEntry[];
  } catch {
    return [];
  }
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

/** SRS/verification-due review words — used by buildReviewPlan. */
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
    .or(`and(srs_status.neq.new,next_review_at.lte.${today}),verification_due_at.lte.${today}`)
    .order("next_review_at", { ascending: true })
    .limit(limit);

  if (error) return [];
  return (data ?? []) as WordBankEntry[];
}

/** Weak words (new / learning) for the review hub — lowest ease first. */
export async function getWeakWordsForReview(
  userId: string,
  limit: number,
): Promise<WordBankEntry[]> {
  if (limit <= 0) return [];
  const supabase = getSupabaseBrowserClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select(DAILY_WORD_COLUMNS)
    .eq('user_id', userId)
    .eq('status', 'ready')
    .in('srs_status', ['new', 'learning'])
    .order('ease_factor', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as WordBankEntry[];
}

/** Load word_bank rows by primary key (failed-sentence drill). */
export async function getWordBankEntriesByIds(ids: string[]): Promise<WordBankEntry[]> {
  if (ids.length === 0) return [];
  const supabase = getSupabaseBrowserClient();

  const { data, error } = await supabase
    .from(TABLE)
    .select(DAILY_WORD_COLUMNS)
    .in('id', ids);

  if (error) throw error;
  return (data ?? []) as WordBankEntry[];
}

export async function countWordsDueForReviewClient(userId: string): Promise<number> {
  const supabase = getSupabaseBrowserClient();
  const today = new Date().toISOString();
  const { count, error } = await supabase
    .from(TABLE)
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "ready")
    .or(`and(srs_status.neq.new,next_review_at.lte.${today}),verification_due_at.lte.${today}`);

  if (error) return 0;
  return count ?? 0;
}


