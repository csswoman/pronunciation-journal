import { getWordOfDay } from "@/lib/word-of-day";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const forceRefresh = new URL(request.url).searchParams.get("refresh") === "1";

  try {
    const result = await getWordOfDay({ forceRefresh });
    return NextResponse.json(result, {
      headers: { "Cache-Control": forceRefresh ? "no-store" : "public, max-age=3600" },
    });
  } catch (error) {
    console.error("word-of-day error:", error);
    const fallback = await getWordOfDay();
    return NextResponse.json(fallback, {
      headers: { "Cache-Control": "no-store" },
    });
  }
}
