import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

type UserSupabaseClient = SupabaseClient<Database>;

export async function enqueueWordEnrichmentJob(
  supabase: UserSupabaseClient,
  userId: string,
  wordId: string
): Promise<string> {
  const { data, error } = await supabase
    .from("word_enrichment_jobs")
    .insert({
      user_id: userId,
      word_id: wordId,
      status: "queued",
    })
    .select("id")
    .single();

  if (error || !data) {
    throw error ?? new Error("Failed to enqueue word enrichment job");
  }

  return data.id;
}
