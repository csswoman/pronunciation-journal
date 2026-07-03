import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 0;

// ---------------------------------------------------------------------------
// Liveness vs Readiness
//
// GET /api/health           → liveness: is the process alive? (fast, no I/O)
// GET /api/health?ready=1   → readiness: can it serve traffic? (checks deps)
// ---------------------------------------------------------------------------

interface CheckResult {
  ok: boolean;
  latencyMs?: number;
  message?: string;
}

async function checkSupabase(): Promise<CheckResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return { ok: false, message: "Supabase env vars missing" };
  }
  const start = Date.now();
  try {
    const client = createClient(url, anonKey, { auth: { persistSession: false } });
    // Lightweight query that hits the DB without exposing any data.
    const { error } = await client.from("user_profiles").select("id").limit(0);
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

function checkGemini(): CheckResult {
  const hasKey = Boolean(process.env.GEMINI_API_KEY);
  return hasKey
    ? { ok: true }
    : { ok: false, message: "GEMINI_API_KEY not configured" };
}

export async function GET(request: Request): Promise<NextResponse> {
  const isReadiness = new URL(request.url).searchParams.has("ready");
  const version = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "unknown";

  // Liveness: the process is alive if this handler runs.
  if (!isReadiness) {
    return NextResponse.json({ status: "ok", version }, { status: 200 });
  }

  // Readiness: check external dependencies.
  const [supabase] = await Promise.all([checkSupabase()]);
  const gemini = checkGemini();

  const allOk = supabase.ok && gemini.ok;

  return NextResponse.json(
    {
      status: allOk ? "ready" : "degraded",
      version,
      checks: {
        supabase: supabase.ok
          ? { status: "ok", latencyMs: supabase.latencyMs }
          : { status: "error", latencyMs: supabase.latencyMs, message: supabase.message },
        gemini: gemini.ok
          ? { status: "ok" }
          : { status: "error", message: gemini.message },
      },
    },
    { status: allOk ? 200 : 503 }
  );
}
