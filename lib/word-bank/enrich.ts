import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { enrichWithGemini } from "./gemini";
import { getWordAudio } from "./audio";

const ENRICH_TIMEOUT_MS = 45_000;

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
 * Failures are caught and persisted as `status = 'failed'` so the UI can react.
 */
export async function enrichWord(wordId: string): Promise<void> {
  const supabase = getSupabaseAdminClient();

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

    const audioResult = await getWordAudio(row.text);

    const { error: updateErr } = await supabase
      .from("word_bank")
      .update({
        meaning: enriched.meaning || null,
        translation: enriched.translation || null,
        ipa: enriched.ipa || null,
        example: enriched.example || null,
        synonyms: enriched.synonyms.length ? enriched.synonyms : null,
        image_prompt: enriched.image_prompt || null,
        audio_url: audioResult.url,
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
