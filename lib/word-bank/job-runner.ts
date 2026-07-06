import { enrichWord } from "@/lib/word-bank/enrich";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const MAX_ATTEMPTS = 3;
const BATCH_SIZE = 10;

function retryDelayMinutes(attempts: number): number {
  return Math.min(60, 2 ** Math.max(0, attempts - 1));
}

export function buildEnrichmentFailurePlan(
  attempts: number,
  err: unknown,
  now = Date.now()
): {
  exhausted: boolean;
  wordStatus: "processing" | "failed";
  wordErrorReason: "retry_scheduled" | "enrichment_failed";
  jobStatus: "queued" | "failed";
  runAfter: string;
  lastError: string;
} {
  const exhausted = attempts >= MAX_ATTEMPTS;
  const runAfter = exhausted
    ? new Date(now).toISOString()
    : new Date(now + retryDelayMinutes(attempts) * 60_000).toISOString();
  const message = err instanceof Error ? err.message : "enrichment_failed";

  return {
    exhausted,
    wordStatus: exhausted ? "failed" : "processing",
    wordErrorReason: exhausted ? "enrichment_failed" : "retry_scheduled",
    jobStatus: exhausted ? "failed" : "queued",
    runAfter,
    lastError: message.slice(0, 500),
  };
}

export async function processWordEnrichmentJobs(workerId = "word-enrichment-worker"): Promise<number> {
  const supabase = getSupabaseAdminClient();
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

    try {
      await enrichWord(job.word_id);
    } catch (err) {
      const failure = buildEnrichmentFailurePlan(nextAttempts, err);

      await supabase
        .from("word_bank")
        .update({
          status: failure.wordStatus,
          error_reason: failure.wordErrorReason,
        })
        .eq("id", job.word_id);

      await supabase
        .from("word_enrichment_jobs")
        .update({
          status: failure.jobStatus,
          run_after: failure.runAfter,
          locked_at: null,
          locked_by: null,
          last_error: failure.lastError,
        })
        .eq("id", job.id);

      processed++;
      continue;
    }

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
