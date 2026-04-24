import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { WordBankEntry } from "@/lib/types";

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
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }

  const { word } = (await res.json()) as { word: WordBankEntry };
  return word;
}

export async function deleteWord(id: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) throw error;
}

export async function incrementDifficulty(
  id: string,
  newValue: number
): Promise<WordBankEntry> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from(TABLE)
    .update({ difficulty: newValue })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as WordBankEntry;
}

/** Manually trigger re-enrichment (e.g. for a `failed` word). */
export async function retryEnrichment(id: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const res = await fetch(`/api/words/${id}/enrich`, {
    method: "POST",
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
}
