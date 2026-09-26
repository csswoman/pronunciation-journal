import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";
import type { SupabaseClient } from "@supabase/supabase-js";

export type FeedbackReportRow = Database["public"]["Tables"]["ai_feedback_reports"]["Row"];

/**
 * Fetches feedback reports submitted by the current authenticated user.
 * RLS enforces that a user can only read their own reports.
 */
export async function fetchOwnFeedbackReports(
  client?: SupabaseClient<Database>,
  limit = 100,
): Promise<FeedbackReportRow[]> {
  const supabase = client ?? getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("ai_feedback_reports")
    .select("id, user_id, feature, prompt_version, input_snapshot, output_snapshot, error_pattern, comment, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error("Unable to fetch feedback reports: " + error.message);
  }
  if (!data) {
    throw new Error("Feedback report query returned no data.");
  }
  return data as FeedbackReportRow[];
}
