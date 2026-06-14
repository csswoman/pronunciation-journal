import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Json, Tables } from "@/lib/supabase/types";

export interface DeckCounts {
  words: Record<string, number>;
  due: Record<string, number>;
  mastered: Record<string, number>;
}

export interface DeckSummary {
  id: string;
  name: string;
}

interface DeckEntryRow {
  deck_id: string;
  entries: { id: string; sound_id: string | null } | null;
}

interface ContrastProgressRow {
  contrast_id: string;
  total_attempts: number;
  correct_answers: number;
  next_review: string | null;
}

/** Full deck rows for the current user, newest first. */
export async function getUserDecksFull(userId: string): Promise<Tables<"decks">[]> {
  const supabase = getSupabaseBrowserClient();
  const { data } = await supabase
    .from("decks")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

/**
 * Per-deck word counts plus due/mastered signals derived from contrast progress.
 * Ready for deck grid UI — no table or join details leak to callers.
 */
export async function getDeckCounts(userId: string): Promise<DeckCounts> {
  const supabase = getSupabaseBrowserClient();

  const [{ data: entriesData }, { data: progressData }] = await Promise.all([
    supabase.from("deck_entries").select("deck_id, entries(id, sound_id)"),
    supabase
      .from("user_contrast_progress")
      .select("contrast_id, total_attempts, correct_answers, next_review")
      .eq("user_id", userId),
  ]);

  const byIpa = new Map<string, { correct: number; total: number; minNextReview: Date | null }>();
  for (const p of (progressData as ContrastProgressRow[] | null) ?? []) {
    const [ipaA] = p.contrast_id.split("|");
    const prev = byIpa.get(ipaA) ?? { correct: 0, total: 0, minNextReview: null };
    const nr = p.next_review ? new Date(p.next_review) : null;
    byIpa.set(ipaA, {
      correct: prev.correct + p.correct_answers,
      total: prev.total + p.total_attempts,
      minNextReview: nr && (!prev.minNextReview || nr < prev.minNextReview) ? nr : prev.minNextReview,
    });
  }

  const soundIds = [
    ...new Set(
      ((entriesData as DeckEntryRow[] | null) ?? [])
        .map((r) => r.entries?.sound_id)
        .filter((id): id is string => id != null),
    ),
  ];

  const soundIpaMap = new Map<string, string>();
  if (soundIds.length > 0) {
    const { data: soundRows } = await supabase
      .from("sounds")
      .select("id, ipa")
      .in("id", soundIds.map(Number));
    for (const s of soundRows ?? []) soundIpaMap.set(String(s.id), s.ipa ?? "");
  }

  const words: Record<string, number> = {};
  const due: Record<string, number> = {};
  const mastered: Record<string, number> = {};
  const now = new Date();

  ((entriesData as DeckEntryRow[] | null) ?? []).forEach((row) => {
    words[row.deck_id] = (words[row.deck_id] ?? 0) + 1;
    const soundId = row.entries?.sound_id;
    if (!soundId) return;
    const ipa = soundIpaMap.get(soundId);
    if (!ipa) return;
    const progress = byIpa.get(ipa);
    if (!progress) return;
    const accuracy = progress.total > 0 ? progress.correct / progress.total : 0;
    if (accuracy >= 0.85 && progress.total >= 10) {
      mastered[row.deck_id] = (mastered[row.deck_id] ?? 0) + 1;
    }
    if (progress.minNextReview && progress.minNextReview <= now) {
      due[row.deck_id] = (due[row.deck_id] ?? 0) + 1;
    }
  });

  return { words, due, mastered };
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
    .select("id, user_id, entry_id, created_at, updated_at, ease_factor, interval_days, last_reviewed_at, next_review_at, repetitions, status")
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

export async function hasWordBankEntries(deckId: string): Promise<boolean> {
  const { count } = await getSupabaseBrowserClient()
    .from("word_bank_decks")
    .select("*", { count: "exact", head: true })
    .eq("deck_id", deckId);
  return (count ?? 0) > 0;
}

export async function deleteDeck(deckId: string): Promise<void> {
  await getSupabaseBrowserClient().from("decks").delete().eq("id", deckId);
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

// --- Deck mutation functions ---

export async function addWordsToDeck(wordIds: string[], deckId: string): Promise<void> {
  const links = wordIds.map((word_id) => ({ word_id, deck_id: deckId }));
  const { error } = await getSupabaseBrowserClient()
    .from("word_bank_decks")
    .upsert(links, { ignoreDuplicates: true });
  if (error) throw new Error(error.message);
}

export async function createDeck(params: {
  name: string;
  description?: string | null;
  color: string;
  icon: string;
  userId: string;
}): Promise<Tables<"decks">> {
  const { data, error } = await getSupabaseBrowserClient()
    .from("decks")
    .insert({ name: params.name, description: params.description ?? null, color: params.color, icon: params.icon, user_id: params.userId })
    .select()
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to create deck");
  return data;
}

export async function updateDeck(
  deckId: string,
  params: { name: string; description?: string | null; color: string; icon: string }
): Promise<Tables<"decks">> {
  const { data, error } = await getSupabaseBrowserClient()
    .from("decks")
    .update({ name: params.name, description: params.description ?? null, color: params.color, icon: params.icon, updated_at: new Date().toISOString() })
    .eq("id", deckId)
    .select()
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to update deck");
  return data;
}

export async function createDeckWithWords(
  deckParams: { name: string; description?: string | null; color: string; icon: string; userId: string },
  wordIds: string[]
): Promise<Tables<"decks">> {
  const supabase = getSupabaseBrowserClient();
  const { data: deck, error: deckErr } = await supabase
    .from("decks")
    .insert({ name: deckParams.name, description: deckParams.description ?? null, color: deckParams.color, icon: deckParams.icon, user_id: deckParams.userId })
    .select()
    .single();
  if (deckErr || !deck) throw new Error(deckErr?.message ?? "Failed to create deck");
  const links = wordIds.map((word_id) => ({ word_id, deck_id: deck.id }));
  const { error: linkErr } = await supabase.from("word_bank_decks").insert(links);
  if (linkErr) throw new Error(linkErr.message);
  return deck;
}

// --- ManageDrawer operations ---

export async function getDeckEntries(deckId: string): Promise<Tables<"entries">[]> {
  const supabase = getSupabaseBrowserClient();
  const { data } = await supabase.from("deck_entries").select("entry_id, entries(*)").eq("deck_id", deckId);
  return ((data ?? []) as { entries: Tables<"entries"> | null }[])
    .map((row) => row.entries)
    .filter(Boolean) as Tables<"entries">[];
}

export async function findEntryByWord(userId: string, word: string): Promise<{ id: string } | null> {
  const { data } = await getSupabaseBrowserClient()
    .from("entries")
    .select("id")
    .eq("user_id", userId)
    .ilike("word", word)
    .maybeSingle();
  return data ?? null;
}

export async function insertEntry(params: {
  word: string;
  userId: string;
  difficulty: number;
  phrases: string[] | null;
  meanings: unknown;
  id: string;
}): Promise<{ id: string }> {
  const { data, error } = await getSupabaseBrowserClient()
    .from("entries")
    .insert({ word: params.word, user_id: params.userId, difficulty: params.difficulty, phrases: params.phrases, meanings: params.meanings as Json, id: params.id })
    .select("id")
    .single();
  if (error) throw error;
  return data;
}

export async function findDeckEntry(deckId: string, entryId: string): Promise<{ deck_id: string; entry_id: string } | null> {
  const { data } = await getSupabaseBrowserClient()
    .from("deck_entries")
    .select("*")
    .eq("deck_id", deckId)
    .eq("entry_id", entryId)
    .maybeSingle();
  return data as { deck_id: string; entry_id: string } | null;
}

export async function insertDeckEntry(deckId: string, entryId: string): Promise<void> {
  await getSupabaseBrowserClient()
    .from("deck_entries")
    .insert({ deck_id: deckId, entry_id: entryId });
}

export async function removeDeckEntry(deckId: string, entryId: string): Promise<void> {
  await getSupabaseBrowserClient()
    .from("deck_entries")
    .delete()
    .eq("deck_id", deckId)
    .eq("entry_id", entryId);
}

export async function removeDeckEntries(deckId: string, entryIds: string[]): Promise<void> {
  await getSupabaseBrowserClient()
    .from("deck_entries")
    .delete()
    .eq("deck_id", deckId)
    .in("entry_id", entryIds);
}

export async function getEntryMeanings(entryId: string): Promise<{ meanings: unknown }> {
  const { data } = await getSupabaseBrowserClient()
    .from("entries")
    .select("meanings")
    .eq("id", entryId)
    .single();
  return { meanings: data?.meanings ?? null };
}

export async function updateEntryContent(
  entryId: string,
  params: { phrases: string[] | null; meanings: unknown }
): Promise<void> {
  await getSupabaseBrowserClient()
    .from("entries")
    .update({ phrases: params.phrases, meanings: params.meanings as Json, updated_at: new Date().toISOString() })
    .eq("id", entryId);
}
