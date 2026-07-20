import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface HomePlacementState {
  hasPlacement: boolean;
  hasMeaningfulProgress: boolean;
}

function isMissingTable(error: { code?: string } | null): boolean {
  return error?.code === "PGRST205" || error?.code === "42P01";
}

/**
 * Determines whether Home should promote placement. CEFR is deliberately not
 * used because every profile receives a default level before being assessed.
 */
export async function getHomePlacementState(userId: string): Promise<HomePlacementState> {
  const supabase = await createSupabaseServerClient();
  const [placement, answers, words, sounds] = await Promise.all([
    supabase
      .from("assessment_results")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("mode", "placement"),
    supabase
      .from("answer_history")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("word_bank")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("user_contrast_progress")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gt("total_attempts", 0),
  ]);

  for (const result of [answers, words, sounds]) {
    if (result.error) throw result.error;
  }
  if (placement.error && !isMissingTable(placement.error)) throw placement.error;

  return {
    hasPlacement: !placement.error && (placement.count ?? 0) > 0,
    hasMeaningfulProgress: [answers, words, sounds]
      .some((result) => (result.count ?? 0) > 0),
  };
}
