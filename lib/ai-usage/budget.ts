import "server-only";
import { logServerError } from "@/lib/api/logging";
import { tryGetSupabaseAdminClient } from "@/lib/supabase/service-role";

/** Daily ceilings are 80% of the Free Tier RPD observed for this project. */
export const DAILY_BUDGET = {
  "gemini-3.1-flash-lite": 400,
  "gemini-3.5-flash-lite": 400,
  "gemini-2.5-flash-lite": 16,
  "gemini-3.8-flash": 16,
  "gemini-3.8-flash-lite-tts": 8,
  "gemini-3.8-flash-tts": 8,
} as const satisfies Record<string, number>;

export async function reserveModel(model: string, feature: string): Promise<boolean> {
  const limit = DAILY_BUDGET[model as keyof typeof DAILY_BUDGET];
  if (!limit) return false;

  const supabase = tryGetSupabaseAdminClient();
  if (!supabase) {
    logServerError("AI usage reservation unavailable; allowing request", new Error("Missing database client"), {
      endpoint: feature,
      operation: "reserveModel",
    }, "warn");
    return true;
  }

  try {
    const { data, error } = await supabase.rpc("ai_usage_try_reserve", {
      p_model: model,
      p_feature: feature,
      p_limit: limit,
    });
    if (error) {
      logServerError("AI usage reservation failed; allowing request", error, {
        endpoint: feature,
        operation: "reserveModel",
      }, "warn");
      return true;
    }
    if (typeof data !== "boolean") {
      logServerError("AI usage reservation returned an invalid result; allowing request", new Error("Invalid RPC result"), {
        endpoint: feature,
        operation: "reserveModel",
      }, "warn");
      return true;
    }
    return data;
  } catch (error) {
    logServerError("AI usage reservation threw; allowing request", error, {
      endpoint: feature,
      operation: "reserveModel",
    }, "warn");
    return true;
  }
}

export async function recordModelFailure(model: string, feature: string): Promise<void> {
  await recordUsage(model, feature, 1, 0);
}

export async function recordCacheHit(model: string, feature: string): Promise<void> {
  await recordUsage(model, feature, 0, 1);
}

export async function recordSharedCacheHit(feature: string): Promise<void> {
  await recordUsage("cache", feature, 0, 1);
}

async function recordUsage(
  model: string,
  feature: string,
  failureDelta: number,
  cacheHitDelta: number,
): Promise<void> {
  if (model !== "cache" && !(model in DAILY_BUDGET)) return;
  const supabase = tryGetSupabaseAdminClient();
  if (!supabase) return;

  try {
    const { error } = await supabase.rpc("ai_usage_record", {
      p_model: model,
      p_feature: feature,
      p_failure_delta: failureDelta,
      p_cache_hit_delta: cacheHitDelta,
    });
    if (error) {
      logServerError("AI usage telemetry write failed", error, {
        endpoint: feature,
        operation: "recordUsage",
      }, "warn");
    }
  } catch (error) {
    logServerError("AI usage telemetry write threw", error, {
      endpoint: feature,
      operation: "recordUsage",
    }, "warn");
  }
}
