import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";

export interface DeckSummary {
  id: string;
  name: string;
}

export async function getUserDecks(userId: string): Promise<DeckSummary[]> {
  const supabase = getSupabaseBrowserClient();
  const { data } = await supabase
    .from("decks")
    .select("id, name")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

type Entry = Tables<"entries">;
type Progress = Tables<"deck_entry_progress">;

export interface CardWithProgress extends Entry {
  progress: Progress | null;
}

export async function getDeckCardsWithProgress(
  deckId: string,
  userId: string
): Promise<CardWithProgress[]> {
  const supabase = getSupabaseBrowserClient();

  const { data: deckEntries } = await supabase
    .from("deck_entries")
    .select("entry_id, entries(*)")
    .eq("deck_id", deckId);

  const entries = ((deckEntries ?? []) as { entries: Entry | null }[])
    .map((r) => r.entries)
    .filter(Boolean) as Entry[];

  if (!entries.length) return [];

  const { data: progressRows } = await supabase
    .from("deck_entry_progress")
    .select("*")
    .eq("user_id", userId)
    .in("entry_id", entries.map((e) => e.id));

  const progressMap = new Map<string, Progress>(
    (progressRows ?? []).map((p) => [p.entry_id, p as Progress])
  );

  const now = new Date();
  return entries
    .map((e) => ({ ...e, progress: progressMap.get(e.id) ?? null }))
    .filter((c) => !c.progress || new Date(c.progress.next_review_at) <= now)
    .sort(() => Math.random() - 0.5);
}

export async function upsertCardProgress(
  userId: string,
  entryId: string,
  progress: Omit<Progress, "id" | "created_at" | "user_id" | "entry_id">
): Promise<void> {
  await getSupabaseBrowserClient()
    .from("deck_entry_progress")
    .upsert({ user_id: userId, entry_id: entryId, ...progress }, { onConflict: "user_id,entry_id" });
}
