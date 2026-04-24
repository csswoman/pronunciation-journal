import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { enrichWithGemini } from "./gemini";

const ENRICH_TIMEOUT_MS = 45_000;

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

function getFailureReason(err: unknown): "parse_error" | "api_error" {
  if (err instanceof SyntaxError) return "parse_error";
  const message = String((err as { message?: unknown })?.message ?? "").toLowerCase();
  if (message.includes("json object") || message.includes("unexpected token")) return "parse_error";
  return "api_error";
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error("Enrichment timed out")), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

/**
 * Background enrichment: fetch word, ask Gemini, persist enriched fields.
 * Runs without awaiting from the API route (`void enrichWord(id)`).
 * Failures are caught and persisted as `status = 'failed'` so the UI can react.
 */
export async function enrichWord(wordId: string): Promise<void> {
  const supabase = getAdminClient();

  const { data: row, error: fetchErr } = await supabase
    .from("word_bank")
    .select("id, text, context, status")
    .eq("id", wordId)
    .maybeSingle();

  if (fetchErr || !row) {
    console.error("[word-bank] enrichWord fetch failed:", fetchErr);
    return;
  }

  if (row.status !== "processing") return;

  try {
    const enriched = await withTimeout(enrichWithGemini(row.text, row.context), ENRICH_TIMEOUT_MS);

    const { error: updateErr } = await supabase
      .from("word_bank")
      .update({
        meaning: enriched.meaning || null,
        translation: enriched.translation || null,
        ipa: enriched.ipa || null,
        example: enriched.example || null,
        synonyms: enriched.synonyms.length ? enriched.synonyms : null,
        image_prompt: enriched.image_prompt || null,
        status: "ready",
        error_reason: null,
      })
      .eq("id", wordId)
      .eq("status", "processing");

    if (updateErr) {
      console.error("[word-bank] enrichWord update failed:", updateErr);
    }
  } catch (err) {
    console.error("[word-bank] enrichWord error:", err);
    await supabase
      .from("word_bank")
      .update({
        status: "failed",
        error_reason: getFailureReason(err),
      })
      .eq("id", wordId)
      .eq("status", "processing");
  }
}
