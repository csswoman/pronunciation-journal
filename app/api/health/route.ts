import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 0;

// ---------------------------------------------------------------------------
// Liveness vs Readiness
//
// GET /api/health           → liveness: is the process alive? (fast, no I/O)
// GET /api/health?ready=1   → readiness: can it serve traffic? (checks deps)
// ---------------------------------------------------------------------------

export async function GET(request: Request): Promise<NextResponse> {
  const isReadiness = new URL(request.url).searchParams.has("ready");
  const version = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "unknown";

  // Liveness: the process is alive if this handler runs.
  if (!isReadiness) {
    return NextResponse.json({ status: "ok", version }, { status: 200 });
  }

  // Keep liveness independent from readiness dependencies. In particular,
  // do not load the Supabase client when the process-only probe is requested.
  const { buildReadinessPayload } = await import("@/app/api/health/checks");
  const { payload, status } = await buildReadinessPayload();
  return NextResponse.json(payload, { status });
}
