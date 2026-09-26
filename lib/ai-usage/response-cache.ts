import "server-only";
import { createHash } from "node:crypto";
import type { Json } from "@/lib/supabase/types";
import { logServerError } from "@/lib/api/logging";
import { withOperationTimeout } from "@/lib/api/timeout";
import { tryGetSupabaseAdminClient } from "@/lib/supabase/service-role";

const CACHE_IO_TIMEOUT_MS = 750;

const CACHE_PROMPT_VERSIONS: Record<string, string> = {
  "/api/gemini/translate": "translate-v1",
  "/api/gemini/word-search": "word-search-v1",
};

export function normalizeAiCacheText(value: string): string {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ");
}

export function buildAiResponseCacheKey(feature: string, normalizedInput: unknown): string {
  const promptVersion = CACHE_PROMPT_VERSIONS[feature];
  if (!promptVersion) throw new Error(`AI response cache is not enabled for ${feature}`);
  return createHash("sha256")
    .update(JSON.stringify([feature, promptVersion, normalizedInput]))
    .digest("hex");
}

export async function getAiResponseCache<T>(feature: string, key: string): Promise<T | null> {
  const supabase = tryGetSupabaseAdminClient();
  if (!supabase) return null;

  try {
    const { data, error } = await withOperationTimeout(
      supabase
        .from("ai_response_cache")
        .select("feature, payload")
        .eq("key", key)
        .eq("feature", feature)
        .maybeSingle(),
      CACHE_IO_TIMEOUT_MS,
      "AI response cache read",
    );
    if (error) {
      logServerError("AI response cache read failed", error, {
        endpoint: feature,
        operation: "cacheRead",
      }, "warn");
      return null;
    }
    return (data?.payload as T | undefined) ?? null;
  } catch (error) {
    logServerError("AI response cache read threw", error, {
      endpoint: feature,
      operation: "cacheRead",
    }, "warn");
    return null;
  }
}

export async function setAiResponseCache(
  feature: string,
  key: string,
  payload: unknown,
): Promise<void> {
  const supabase = tryGetSupabaseAdminClient();
  if (!supabase) return;

  try {
    const { error } = await withOperationTimeout(
      supabase.from("ai_response_cache").upsert({
        key,
        feature,
        payload: payload as Json,
      }, { onConflict: "key" }),
      CACHE_IO_TIMEOUT_MS,
      "AI response cache write",
    );
    if (error) {
      logServerError("AI response cache write failed", error, {
        endpoint: feature,
        operation: "cacheWrite",
      }, "warn");
    }
  } catch (error) {
    logServerError("AI response cache write threw", error, {
      endpoint: feature,
      operation: "cacheWrite",
    }, "warn");
  }
}
