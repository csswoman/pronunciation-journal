import { NextRequest, NextResponse } from "next/server";
import { enrichWord } from "@/lib/word-bank/enrich";
import { redactError } from "@/lib/api/guards";
import { logServerError } from "@/lib/api/logging";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/types";

// GitHub Actions invokes this worker periodically because Vercel Hobby only
// supports daily cron schedules. maxDuration gives each small batch time to finish.
export const maxDuration = 120;
export const runtime = "nodejs";

const BATCH_SIZE = 3;
// Exponential backoff: attempt 1 → 2 min, 2 → 8 min, 3 → 30 min, 4 → 2 h
const BACKOFF_SECONDS = [120, 480, 1800, 7200];
const MAX_ATTEMPTS = 5;

type JobRow = Database["public"]["Tables"]["word_enrichment_jobs"]["Row"];

function verifyCronSecret(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    // Allow in dev/test when secret is not configured.
    return process.env.NODE_ENV !== "production";
  }
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();

  // Claim a batch of jobs atomically via SELECT FOR UPDATE SKIP LOCKED.
  // claim_enrichment_jobs is a new RPC not yet reflected in generated types; cast is safe here.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rawJobs, error: claimErr } = await (supabase as any).rpc("claim_enrichment_jobs", {
    p_batch_size: BATCH_SIZE,
    p_worker_id: "scheduled-worker",
  });

  if (claimErr) {
    logServerError("Enrichment job claim failed", claimErr, {
      endpoint: "/api/jobs/drain-enrichment",
      operation: "claim",
    });
    return NextResponse.json({ error: "Failed to claim jobs" }, { status: 500 });
  }

  const jobs = (rawJobs as JobRow[] | null) ?? [];

  if (jobs.length === 0) {
    return NextResponse.json({ processed: 0, message: "No jobs queued" });
  }

  const results: Array<{ id: string; status: "succeeded" | "failed"; error?: string }> = [];

  for (const job of jobs) {
    try {
      await enrichWord(job.word_id);

      await supabase
        .from("word_enrichment_jobs")
        .update({
          status: "succeeded",
          locked_at: null,
          locked_by: null,
          last_error: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", job.id);

      results.push({ id: job.id, status: "succeeded" });
    } catch (err: unknown) {
      const nextAttempt = job.attempts + 1;
      const backoffSeconds =
        nextAttempt < BACKOFF_SECONDS.length ? BACKOFF_SECONDS[nextAttempt] : BACKOFF_SECONDS.at(-1)!;
      const runAfter = new Date(Date.now() + backoffSeconds * 1000).toISOString();
      const redacted = redactError(err);

      await supabase
        .from("word_enrichment_jobs")
        .update({
          status: nextAttempt >= MAX_ATTEMPTS ? "failed" : "queued",
          attempts: nextAttempt,
          last_error: `${redacted.type}: ${redacted.message}`,
          run_after: runAfter,
          locked_at: null,
          locked_by: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", job.id);

      logServerError("Enrichment job failed", err, {
        endpoint: "/api/jobs/drain-enrichment",
        operation: "processJob",
      });
      results.push({ id: job.id, status: "failed", error: redacted.message });
    }
  }

  const succeeded = results.filter((r) => r.status === "succeeded").length;
  const failed = results.filter((r) => r.status === "failed").length;

  console.log(`[drain-enrichment] batch done: ${succeeded} succeeded, ${failed} failed`);

  return NextResponse.json({ processed: jobs.length, succeeded, failed, results });
}
