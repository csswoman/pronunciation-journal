import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSameOrigin, requireUser, rateLimit, validateBody, publicErrorResponse, redactError } from "@/lib/api/guards";
import { createSupabaseServerClient as createClient } from "@/lib/supabase/server";
import { DECK_SUGGEST_SYSTEM_PROMPT } from "@/lib/ai-prompts";
import { callWithFallback, getErrorStatus, stripJsonFences } from "@/lib/gemini/client";

const DeckSuggestSchema = z.object({
  deckName: z.string().min(1).max(100),
  deckDescription: z.string().max(500).optional(),
  difficulty: z.number().int().min(0).max(3).optional(),
  seed: z.string().max(100).optional(),
  existingWords: z.array(z.string().max(100)).max(200).optional(),
});

const CACHE_TTL_DAYS = 7;

function buildCacheKey(deckName: string, description: string, difficulty: number): string {
  return `${deckName.toLowerCase().trim()}|${description.toLowerCase().trim()}|${difficulty}`;
}

type Suggestion = { word: string; meaning: string };

async function getCached(key: string): Promise<Suggestion[] | null> {
  const supabase = await createClient();
  const cutoff = new Date(Date.now() - CACHE_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("deck_suggestions_cache")
    .select("suggestions")
    .eq("cache_key", key)
    .gte("created_at", cutoff)
    .single();
  if (!data) return null;
  return data.suggestions as Suggestion[];
}

async function setCached(key: string, suggestions: Suggestion[]): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase
      .from("deck_suggestions_cache")
      .upsert({ cache_key: key, suggestions, created_at: new Date().toISOString() }, { onConflict: "cache_key" });
  } catch {
    // Cache writes must not fail the user-facing AI response.
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const { user, error: authError } = await requireUser();
  if (authError) return authError as NextResponse;

  const { limited, error: rateLimitError } = await rateLimit(`/api/gemini/deck-suggest:${user.id}`, {
    max: 10,
    windowMs: 60_000,
    meta: { endpoint: "/api/gemini/deck-suggest", userId: user.id },
  });
  if (limited) return rateLimitError as NextResponse;

  const { data: body, error: validationError } = await validateBody(request, DeckSuggestSchema);
  if (validationError) return validationError as NextResponse;

  const difficulty = body.difficulty ?? 1;
  const description = body.deckDescription ?? "";

  const hasVariance = !!body.seed || (body.existingWords && body.existingWords.length > 0);
  if (!hasVariance) {
    const cacheKey = buildCacheKey(body.deckName, description, difficulty);
    const cached = await getCached(cacheKey);
    if (cached) return NextResponse.json({ suggestions: cached, cached: true });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "AI service unavailable" }, { status: 503 });

  const difficultyHint =
    typeof body.difficulty === "number" && body.difficulty >= 2
      ? "Use more advanced / less common vocabulary appropriate for an intermediate to advanced learner."
      : "Use common to intermediate vocabulary appropriate for learners.";
  const seedHint = body.seed ? `Use this seed to vary results: ${body.seed}.` : "";
  const existingHint =
    body.existingWords && body.existingWords.length > 0
      ? `\nThe user already has these words in the deck — do NOT suggest any of them: ${body.existingWords.join(", ")}.`
      : "";
  const prompt = description
    ? `Deck: "${body.deckName}"\nDescription: "${description}"\n\n${difficultyHint} ${seedHint}${existingHint}\nSuggest 8 English words or short phrases for this theme.`
    : `Deck: "${body.deckName}"\n\n${difficultyHint} ${seedHint}${existingHint}\nSuggest 8 English words or short phrases for this theme.`;

  try {
    const parsed = await callWithFallback(
      apiKey,
      {
        contents: prompt,
        config: { systemInstruction: DECK_SUGGEST_SYSTEM_PROMPT, responseMimeType: "application/json" },
      },
      (text) => JSON.parse(stripJsonFences(text))
    );

    if (!hasVariance && parsed.suggestions) {
      const cacheKey = buildCacheKey(body.deckName, description, difficulty);
      await setCached(cacheKey, parsed.suggestions);
    }

    return NextResponse.json(parsed);
  } catch (err: unknown) {
    console.error("deck-suggest error:", redactError(err));
    const status = getErrorStatus(err) ?? 500;
    return publicErrorResponse(status >= 500 ? 500 : status, "Failed to generate deck suggestions");
  }
}
