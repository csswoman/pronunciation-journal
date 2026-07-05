import { NextResponse } from "next/server";
import { buildReadinessPayload } from "@/app/api/health/checks";

export const runtime = "nodejs";
export const revalidate = 0;

export async function GET() {
  const { payload, status } = await buildReadinessPayload();
  return NextResponse.json(payload, { status });
}
