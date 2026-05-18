import { createSupabaseServerClient } from "@/lib/supabase/server";

const TABLE = "user_word_progress";

export type CategoryProgress = {
  category_id: string;
  learned_count: number;
};

/** Returns how many words are "learned" per category for the current user. */
export async function getCategoryProgress(): Promise<CategoryProgress[]> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- table not yet in generated types; remove after running supabase gen types
  const { data, error } = await (supabase as any)
    .from(TABLE)
    .select("category_id")
    .eq("user_id", user.id)
    .eq("status", "learned");

  if (error) throw error;

  const counts = new Map<string, number>();
  for (const row of (data ?? []) as { category_id: string }[]) {
    counts.set(row.category_id, (counts.get(row.category_id) ?? 0) + 1);
  }

  return Array.from(counts.entries()).map(([category_id, learned_count]) => ({
    category_id,
    learned_count,
  }));
}
