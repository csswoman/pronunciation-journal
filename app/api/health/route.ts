import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 0;

export async function GET() {
  try {
    // Check database connection (Supabase)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        {
          status: "unhealthy",
          message: "Missing Supabase configuration",
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    }

    // Quick Supabase connectivity check
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: "GET",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
      signal: AbortSignal.timeout(5000), // 5s timeout
    });

    const dbHealthy = response.ok || response.status === 401; // 401 is expected without valid auth scope

    return NextResponse.json(
      {
        status: dbHealthy ? "healthy" : "unhealthy",
        checks: {
          database: dbHealthy ? "✓" : "✗",
          environment: "✓",
          timestamp: new Date().toISOString(),
        },
        version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || "unknown",
      },
      { status: dbHealthy ? 200 : 503 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        status: "unhealthy",
        message,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
