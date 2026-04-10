/**
 * cleanup-audio — Supabase Edge Function
 *
 * Deletes user pronunciation audio files older than 30 days from Storage
 * and clears the matching `user_audio_url` reference in the `entries` table.
 *
 * Skipped (never deleted):
 *   • entries where `keep_permanent = true`
 *   • entries owned by premium users (`user_profiles.role = 'premium'`)
 *
 * Schedule: run once a week via Supabase Cron (see README comment at bottom).
 *
 * Required env vars (set in Supabase Dashboard → Edge Functions → Secrets):
 *   SUPABASE_URL           — your project URL
 *   SUPABASE_SERVICE_ROLE_KEY — service-role key (bypasses RLS so we can read all users)
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BUCKET = "audio";
const RETENTION_DAYS = 30;

Deno.serve(async (req: Request) => {
  // Optional: protect with a shared secret so only the cron caller can invoke it.
  const authHeader = req.headers.get("Authorization");
  const expectedToken = Deno.env.get("CLEANUP_SECRET");
  if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Service-role client: bypasses RLS so we can query all users' entries.
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();

  // ── 1. Fetch candidate entries ──────────────────────────────────────────────
  // Only rows that:
  //   • have a user_audio_url (something to clean)
  //   • were updated more than RETENTION_DAYS ago (or never updated — use created_at)
  //   • are NOT marked keep_permanent
  const { data: candidates, error: fetchError } = await supabase
    .from("entries")
    .select(`
      id,
      user_id,
      user_audio_url,
      keep_permanent,
      updated_at,
      created_at,
      user_profiles!inner ( role )
    `)
    .not("user_audio_url", "is", null)
    .eq("keep_permanent", false)
    // updated_at may be null; fall back to created_at via OR filter below
    .or(`updated_at.lte.${cutoff},and(updated_at.is.null,created_at.lte.${cutoff})`);

  if (fetchError) {
    console.error("Failed to fetch candidates:", fetchError.message);
    return new Response(JSON.stringify({ error: fetchError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!candidates || candidates.length === 0) {
    return new Response(JSON.stringify({ deleted: 0, skipped: 0 }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // ── 2. Filter out premium users ────────────────────────────────────────────
  const toDelete = candidates.filter(
    (row: { user_profiles: { role: string } | null }) =>
      row.user_profiles?.role !== "premium"
  );

  const skipped = candidates.length - toDelete.length;

  // ── 3. Delete files from Storage + clear DB reference ─────────────────────
  let deleted = 0;
  const errors: string[] = [];

  for (const row of toDelete) {
    const audioUrl: string = row.user_audio_url;

    // Extract the storage path from the full URL.
    // URL format: https://<project>.supabase.co/storage/v1/object/public/audio/<user_id>/<uuid>.ogg
    // We need just the path inside the bucket: <user_id>/<uuid>.ogg
    const storagePath = extractStoragePath(audioUrl, BUCKET);
    if (!storagePath) {
      errors.push(`Could not parse storage path for entry ${row.id}: ${audioUrl}`);
      continue;
    }

    // Delete the file from Storage.
    const { error: storageError } = await supabase.storage
      .from(BUCKET)
      .remove([storagePath]);

    if (storageError) {
      // Storage file might already be gone — log but don't abort.
      errors.push(`Storage delete failed for ${storagePath}: ${storageError.message}`);
    }

    // Clear the reference in the DB regardless of storage outcome (prevents dead links).
    const { error: dbError } = await supabase
      .from("entries")
      .update({ user_audio_url: null })
      .eq("id", row.id);

    if (dbError) {
      errors.push(`DB update failed for entry ${row.id}: ${dbError.message}`);
      continue;
    }

    deleted++;
  }

  const result = { deleted, skipped, errors };
  console.log("cleanup-audio result:", JSON.stringify(result));

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});

/**
 * Extracts the path inside the bucket from a Supabase Storage public URL.
 *
 * Input:  "https://xyz.supabase.co/storage/v1/object/public/audio/user-id/uuid.ogg"
 * Output: "user-id/uuid.ogg"
 */
function extractStoragePath(url: string, bucket: string): string | null {
  try {
    const marker = `/object/public/${bucket}/`;
    const idx = url.indexOf(marker);
    if (idx === -1) return null;
    return url.slice(idx + marker.length);
  } catch {
    return null;
  }
}

/*
 * ── Scheduling (run once a week) ─────────────────────────────────────────────
 *
 * Option A — Supabase Dashboard (recommended, no SQL needed):
 *   Dashboard → Database → Cron Jobs → "New Cron Job"
 *   Name:     cleanup-audio-weekly
 *   Schedule: 0 3 * * 1          (every Monday at 03:00 UTC)
 *   Command:  SELECT net.http_post(
 *               url    := 'https://<project-ref>.supabase.co/functions/v1/cleanup-audio',
 *               headers := '{"Authorization": "Bearer <CLEANUP_SECRET>"}'::jsonb
 *             );
 *
 * Option B — pg_cron via SQL migration (requires pg_net + pg_cron extensions):
 *
 *   -- Enable extensions (once):
 *   CREATE EXTENSION IF NOT EXISTS pg_cron;
 *   CREATE EXTENSION IF NOT EXISTS pg_net;
 *
 *   -- Create the job:
 *   SELECT cron.schedule(
 *     'cleanup-audio-weekly',
 *     '0 3 * * 1',   -- every Monday 03:00 UTC
 *     $$
 *       SELECT net.http_post(
 *         url     := 'https://<project-ref>.supabase.co/functions/v1/cleanup-audio',
 *         headers := '{"Authorization": "Bearer <CLEANUP_SECRET>"}'::jsonb
 *       );
 *     $$
 *   );
 *
 *   -- Check scheduled jobs:
 *   SELECT * FROM cron.job;
 *
 *   -- Remove the job if needed:
 *   SELECT cron.unschedule('cleanup-audio-weekly');
 */
