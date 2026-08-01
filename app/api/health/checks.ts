import { createClient } from "@supabase/supabase-js";

export interface CheckResult {
  ok: boolean;
  latencyMs?: number;
  message?: string;
}

export interface ReadinessPayload {
  status: "ready" | "degraded";
  version: string;
  checks: {
    supabase: { status: "ok"; latencyMs?: number } | { status: "error"; latencyMs?: number; message?: string };
    gemini: { status: "ok" } | { status: "error"; message?: string };
  };
}

export async function checkSupabase(): Promise<CheckResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return { ok: false, message: "Supabase env vars missing" };
  }

  const start = Date.now();
  try {
    const client = createClient(url, anonKey, { auth: { persistSession: false } });
    const { error } = await client.rpc("health_check");
    const latencyMs = Date.now() - start;
    if (error) return { ok: false, latencyMs, message: error.message };
    return { ok: true, latencyMs };
  } catch (err: unknown) {
    return {
      ok: false,
      latencyMs: Date.now() - start,
      message: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export function checkGemini(): CheckResult {
  return process.env.GEMINI_API_KEY
    ? { ok: true }
    : { ok: false, message: "GEMINI_API_KEY not configured" };
}

export async function buildReadinessPayload(): Promise<{ payload: ReadinessPayload; status: 200 | 503 }> {
  const version = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "unknown";
  const supabase = await checkSupabase();
  const gemini = checkGemini();
  const allOk = supabase.ok && gemini.ok;

  return {
    status: allOk ? 200 : 503,
    payload: {
      status: allOk ? "ready" : "degraded",
      version,
      checks: {
        supabase: supabase.ok
          ? { status: "ok", latencyMs: supabase.latencyMs }
          : { status: "error", latencyMs: supabase.latencyMs, message: supabase.message },
        gemini: gemini.ok ? { status: "ok" } : { status: "error", message: gemini.message },
      },
    },
  };
}
