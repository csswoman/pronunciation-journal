import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 0;

function buildHealthResponse(
  status: "healthy" | "unhealthy",
  details: Record<string, unknown>,
  code: number,
) {
  return NextResponse.json(
    {
      status,
      checks: {
        timestamp: new Date().toISOString(),
        ...details,
      },
      version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || "unknown",
    },
    { status: code }
  );
}

export async function GET() {
  return buildHealthResponse("healthy", { process: "ok" }, 200);
}

