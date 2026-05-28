import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { WordBankEntry } from "@/lib/word-bank/types";

const TABLE = "word_bank";

/** All words for the current user, newest first. */
export async function getMyWords(): Promise<WordBankEntry[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
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
  const supabase = getSupabaseBrowserClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const res = await fetch("/api/words", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
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

/** Fetch word bank entries whose source_ref matches any of the given lexicon word ids. */
export async function getWordBankEntriesBySourceRefs(
  sourceRefs: string[]
): Promise<WordBankEntry[]> {
  if (sourceRefs.length === 0) return [];
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
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
    .select("*")
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
    .select("*")
    .single();

  if (insertError) throw insertError;
  return { entry: inserted as WordBankEntry, alreadyExisted: false };
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

