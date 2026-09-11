import { getWordOfDay } from "@/lib/word-of-day";
import { NextRequest, NextResponse } from "next/server";
import { checkLayeredRateLimit, requireUser } from "@/lib/api/guards";
import { logServerError } from "@/lib/api/logging";

export const dynamic = "force-dynamic";

// No requireSameOrigin here: this is a read-only GET, not a mutation, and
// browsers frequently omit the `Origin` header on simple same-origin GETs
// (only reliably sent on state-changing requests) — that guard was rejecting
// legitimate same-origin requests with a 403. requireUser + the layered
// rate limit below already gate cost/abuse.
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { user, error: authError } = await requireUser(request);
  if (authError) return authError as NextResponse;

  const params = new URL(request.url).searchParams;
  const forceRefresh = params.get("refresh") === "1";
  const levelParam = params.get("level");
  const level = levelParam && /^[abc][12]$/i.test(levelParam) ? levelParam : undefined;

  // Only `refresh=1` bypasses the shared cache and can reach Gemini, so it gets
  // a tight quota. The cached read is cheap and stays generous.
  const { limited, error: rateLimitError } = await checkLayeredRateLimit({
    request,
    user,
    endpoint: forceRefresh
      ? "/api/gemini/word-of-day:refresh"
      : "/api/gemini/word-of-day",
    maxPermanent: forceRefresh ? 4 : 30,
    maxAnonymous: forceRefresh ? 2 : 10,
  });
  if (limited) return rateLimitError as NextResponse;

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
