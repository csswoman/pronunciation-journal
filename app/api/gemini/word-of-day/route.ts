import { getWordOfDay } from "@/lib/word-of-day";
import { NextRequest, NextResponse } from "next/server";
import { logServerError } from "@/lib/api/logging";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const params = new URL(request.url).searchParams;
  const forceRefresh = params.get("refresh") === "1";
  const levelParam = params.get("level");
  const level = levelParam && /^[abc][12]$/i.test(levelParam) ? levelParam : undefined;

  try {
    const result = await getWordOfDay({ forceRefresh, level });
    return NextResponse.json(result, {
      headers: { "Cache-Control": forceRefresh ? "no-store" : "public, max-age=3600" },
    });
  } catch (error) {
    logServerError("Word of day generation failed", error, {
      endpoint: "/api/gemini/word-of-day",
      operation: "primary",
    });
    try {
      const fallback = await getWordOfDay();
      return NextResponse.json(fallback, {
        headers: { "Cache-Control": "no-store" },
      });
    } catch (fallbackError) {
      logServerError("Word of day fallback failed", fallbackError, {
        endpoint: "/api/gemini/word-of-day",
        operation: "fallback",
      });
      return NextResponse.json(
        {
          word: "clarity",
          ipa: "",
          definition: "The quality of being clear and easy to understand.",
          example_sentence: "Clarity makes practice easier to repeat.",
          difficulty: "beginner",
        },
        { headers: { "Cache-Control": "no-store" } }
      );
    }
  }
}
