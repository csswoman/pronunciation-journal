import { getSupabaseBrowserClient } from "@/lib/supabase/client";

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
