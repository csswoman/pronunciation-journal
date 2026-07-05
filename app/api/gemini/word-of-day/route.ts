import { getWordOfDay } from "@/lib/word-of-day";
import { NextRequest, NextResponse } from "next/server";
import { redactError } from "@/lib/api/guards";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const forceRefresh = new URL(request.url).searchParams.get("refresh") === "1";

  try {
    const result = await getWordOfDay({ forceRefresh });
    return NextResponse.json(result, {
      headers: { "Cache-Control": forceRefresh ? "no-store" : "public, max-age=3600" },
    });
  } catch (error) {
    console.error("word-of-day error:", redactError(error));
    try {
      const fallback = await getWordOfDay();
      return NextResponse.json(fallback, {
        headers: { "Cache-Control": "no-store" },
      });
    } catch (fallbackError) {
      console.error("word-of-day fallback error:", redactError(fallbackError));
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
