import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSameOrigin, requireUser, rateLimit, validateBody } from "@/lib/api/guards";
import { createSupabaseServerClient as createClient } from "@/lib/supabase/server";
import { buildDeckSuggestUserPrompt, DECK_SUGGEST_SYSTEM_PROMPT } from "@/lib/ai-prompts";
import { callGeminiJson, parseGeminiJson } from "@/lib/gemini/json-route";

const DeckSuggestSchema = z.object({
  deckName: z.string().min(1).max(100),
  deckDescription: z.string().max(500).optional(),
  difficulty: z.number().int().min(0).max(3).optional(),
  seed: z.string().max(100).optional(),
  existingWords: z.array(z.string().max(100)).max(200).optional(),
});

const DeckSuggestResponseSchema = z.object({
  suggestions: z.array(z.object({
    word: z.string().min(1).max(100),
    meaning: z.string().min(1).max(500),
  })).min(1).max(50),
}).passthrough();

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

  const { user, error: authError } = await requireUser(request);
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

  const prompt = buildDeckSuggestUserPrompt({
    deckName: body.deckName,
    deckDescription: description,
    difficulty: body.difficulty,
    seed: body.seed,
    existingWords: body.existingWords,
  });

  const { data: parsed, response } = await callGeminiJson({
    endpoint: "/api/gemini/deck-suggest",
    userId: user.id,
    params: {
      contents: prompt,
      config: { systemInstruction: DECK_SUGGEST_SYSTEM_PROMPT, responseMimeType: "application/json" },
    },
    parse: (text) => parseGeminiJson(text, (json) => DeckSuggestResponseSchema.parse(json)),
    failureMessage: "Failed to generate deck suggestions",
  });
  if (response) return response;

  if (!hasVariance && parsed.suggestions) {
    const cacheKey = buildCacheKey(body.deckName, description, difficulty);
    await setCached(cacheKey, parsed.suggestions);
  }

  return NextResponse.json(parsed);
}
