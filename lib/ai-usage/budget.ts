import "server-only";
import { logServerError } from "@/lib/api/logging";
import { withOperationTimeout } from "@/lib/api/timeout";
import { tryGetSupabaseAdminClient } from "@/lib/supabase/service-role";

const AI_USAGE_RPC_TIMEOUT_MS = 750;
const AI_USAGE_CIRCUIT_BREAKER_MS = 30_000;
let unavailableUntil = 0;

/** Daily ceilings are 80% of the Free Tier RPD observed for this project. */
export const DAILY_BUDGET = {
  "gemini-3.1-flash-lite": 400,
  "gemini-3.5-flash-lite": 400,
  "gemini-2.5-flash-lite": 16,
  "gemini-3.8-flash": 16,
  "gemini-3.8-flash-lite-tts": 8,
  "gemini-3.8-flash-tts": 8,
} as const satisfies Record<string, number>;

export interface ReserveModelOptions {
  /** Deny the request when quota telemetry is unavailable. */
  failClosed?: boolean;
  /** A lower task-specific cap; it can never exceed the model's daily budget. */
  limit?: number;
}

export async function reserveModel(
  model: string,
  feature: string,
  options: ReserveModelOptions = {},
): Promise<boolean> {
  const dailyLimit = DAILY_BUDGET[model as keyof typeof DAILY_BUDGET];
  if (!dailyLimit) return false;
  const failClosed = options.failClosed ?? false;
  const limit = options.limit ?? dailyLimit;
  if (!Number.isInteger(limit) || limit < 1 || limit > dailyLimit) return false;
  const onUnavailable = !failClosed;
  if (Date.now() < unavailableUntil) return onUnavailable;

  let supabase: ReturnType<typeof tryGetSupabaseAdminClient>;
  try {
    supabase = tryGetSupabaseAdminClient();
  } catch (error) {
    logServerError(`AI usage reservation unavailable; ${onUnavailable ? "allowing" : "denying"} request`, error, {
      endpoint: feature,
      operation: "reserveModel",
    }, "warn");
    return onUnavailable;
  }
  if (!supabase) {
    logServerError(
      `AI usage reservation unavailable; ${onUnavailable ? "allowing" : "denying"} request`,
      new Error("Missing database client"),
      { endpoint: feature, operation: "reserveModel" },
      "warn",
    );
    return onUnavailable;
  }

  try {
    const { data, error } = await withOperationTimeout(
      supabase.rpc("ai_usage_try_reserve", {
        p_model: model,
        p_feature: feature,
        p_limit: limit,
      }),
      AI_USAGE_RPC_TIMEOUT_MS,
      "AI usage reservation",
    );
    if (error) {
      unavailableUntil = Date.now() + AI_USAGE_CIRCUIT_BREAKER_MS;
      logServerError(`AI usage reservation failed; ${onUnavailable ? "allowing" : "denying"} request`, error, {
        endpoint: feature,
        operation: "reserveModel",
      }, "warn");
      return onUnavailable;
    }
    if (typeof data !== "boolean") {
      logServerError(`AI usage reservation returned an invalid result; ${onUnavailable ? "allowing" : "denying"} request`, new Error("Invalid RPC result"), {
        endpoint: feature,
        operation: "reserveModel",
      }, "warn");
      return onUnavailable;
    }
    return data;
  } catch (error) {
    unavailableUntil = Date.now() + AI_USAGE_CIRCUIT_BREAKER_MS;
    logServerError(`AI usage reservation threw; ${onUnavailable ? "allowing" : "denying"} request`, error, {
      endpoint: feature,
      operation: "reserveModel",
    }, "warn");
    return onUnavailable;
  }
}

export async function recordModelFailure(
  model: string,
  feature: string,
  status?: number,
  errorCode?: string,
  latencyMs?: number,
): Promise<void> {
  await Promise.all([
    recordUsage(model, feature, 1, 0),
    recordModelOutcome(model, feature, false, latencyMs, status, errorCode),
  ]);
}

export async function recordModelSuccess(model: string, feature: string, latencyMs: number): Promise<void> {
  await recordModelOutcome(model, feature, true, latencyMs);
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
    const { error } = await withOperationTimeout(
      supabase.rpc("ai_usage_record", {
        p_model: model,
        p_feature: feature,
        p_failure_delta: failureDelta,
        p_cache_hit_delta: cacheHitDelta,
      }),
      AI_USAGE_RPC_TIMEOUT_MS,
      "AI usage telemetry",
    );
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

async function recordModelOutcome(
  model: string,
  feature: string,
  success: boolean,
  latencyMs?: number,
  status?: number,
  errorCode?: string,
): Promise<void> {
  if (!(model in DAILY_BUDGET)) return;
  const supabase = tryGetSupabaseAdminClient();
  if (!supabase || Date.now() < unavailableUntil) return;

  try {
    const { error } = await withOperationTimeout(
      supabase.rpc("ai_usage_record_outcome", {
        p_model: model,
        p_feature: feature,
        p_success: success,
        p_latency_ms: Math.max(0, Math.round(latencyMs ?? 0)),
        p_status: status ?? null,
        p_error_code: errorCode?.slice(0, 80) ?? null,
      }),
      AI_USAGE_RPC_TIMEOUT_MS,
      "AI outcome telemetry",
    );
    if (error) {
      logServerError("AI outcome telemetry write failed", error, {
        endpoint: feature,
        operation: "recordModelOutcome",
      }, "warn");
    }
  } catch (error) {
    logServerError("AI outcome telemetry write threw", error, {
      endpoint: feature,
      operation: "recordModelOutcome",
    }, "warn");
  }
}

export function _resetAiUsageCircuitForTests(): void {
  unavailableUntil = 0;
}
