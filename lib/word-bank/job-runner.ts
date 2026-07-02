import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { enrichWord } from "@/lib/word-bank/enrich";

const MAX_ATTEMPTS = 3;
const BATCH_SIZE = 10;

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("Supabase admin credentials missing");
  }
  return createClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function retryDelayMinutes(attempts: number): number {
  return Math.min(60, 2 ** Math.max(0, attempts - 1));
}

export async function processWordEnrichmentJobs(workerId = "word-enrichment-worker"): Promise<number> {
  const supabase = getAdminClient();
  const now = new Date().toISOString();

  const { data: jobs, error } = await supabase
    .from("word_enrichment_jobs")
    .select("id, word_id, attempts")
    .in("status", ["queued", "failed"])
    .lte("run_after", now)
    .lt("attempts", MAX_ATTEMPTS)
    .order("created_at", { ascending: true })
    .limit(BATCH_SIZE);

  if (error) throw error;
  if (!jobs?.length) return 0;

  let processed = 0;
  for (const job of jobs) {
    const nextAttempts = job.attempts + 1;
    const { data: claimed } = await supabase
      .from("word_enrichment_jobs")
      .update({
        status: "running",
        attempts: nextAttempts,
        locked_at: new Date().toISOString(),
        locked_by: workerId,
        last_error: null,
      })
      .eq("id", job.id)
      .in("status", ["queued", "failed"])
      .select("id")
      .maybeSingle();

    if (!claimed) continue;

    await supabase
      .from("word_bank")
      .update({ status: "processing", error_reason: null })
      .eq("id", job.word_id);

    await enrichWord(job.word_id);

    const { data: word } = await supabase
      .from("word_bank")
      .select("status, error_reason")
      .eq("id", job.word_id)
      .maybeSingle();

    if (word?.status === "ready") {
      await supabase
        .from("word_enrichment_jobs")
        .update({ status: "succeeded", locked_at: null, locked_by: null, last_error: null })
        .eq("id", job.id);
    } else {
      const exhausted = nextAttempts >= MAX_ATTEMPTS;
      const retryAt = new Date(Date.now() + retryDelayMinutes(nextAttempts) * 60_000).toISOString();
      await supabase
        .from("word_enrichment_jobs")
        .update({
          status: exhausted ? "failed" : "queued",
          run_after: exhausted ? new Date().toISOString() : retryAt,
          locked_at: null,
          locked_by: null,
          last_error: word?.error_reason ?? "enrichment_failed",
        })
        .eq("id", job.id);
    }

    processed++;
  }

  return processed;
}
