import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, rateLimit, validateBody } from "@/lib/api/guards";
import { createSupabaseServerClient as createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Request schema
// ---------------------------------------------------------------------------

const DeckSuggestSchema = z.object({
  deckName: z.string().min(1).max(100),
  deckDescription: z.string().max(500).optional(),
  difficulty: z.number().int().min(0).max(3).optional(),
  seed: z.string().max(100).optional(),
  existingWords: z.array(z.string().max(100)).max(200).optional(),
});

// ---------------------------------------------------------------------------
// Server-defined system prompt — not configurable by client
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are an English vocabulary coach. When given a deck name and optional description, suggest 8 relevant English words or short phrases that fit the theme. Return ONLY valid JSON with no markdown, no code fences, no extra text — just raw JSON.

Format:
{"suggestions":[{"word":"example","meaning":"brief definition or usage context"}]}`;

// ---------------------------------------------------------------------------
// Model configuration
// ---------------------------------------------------------------------------

const ENABLE_PREVIEW_MODELS = process.env.GEMINI_ENABLE_PREVIEW_MODELS === "true";
const BASE_MODELS = [
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
  "gemini-flash-latest",
] as const;
const PREVIEW_MODELS = ["gemini-3.1-flash-lite-preview"] as const;
const FALLBACK_MODELS = ENABLE_PREVIEW_MODELS
  ? [...BASE_MODELS, ...PREVIEW_MODELS]
  : [...BASE_MODELS];

// Cache TTL: 7 days (suggestions for a given deck theme don't change often)
const CACHE_TTL_DAYS = 7;

// ---------------------------------------------------------------------------
// Cache helpers
// ---------------------------------------------------------------------------

function buildCacheKey(deckName: string, description: string, difficulty: number): string {
  const normalized = `${deckName.toLowerCase().trim()}|${description.toLowerCase().trim()}|${difficulty}`;
  return normalized;
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
  const supabase = await createClient();
  await supabase
    .from("deck_suggestions_cache")
    .upsert({ cache_key: key, suggestions, created_at: new Date().toISOString() }, { onConflict: "cache_key" });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getErrorStatus(err: unknown): number | undefined {
  if (!err || typeof err !== "object") return undefined;
  const maybe = err as { status?: unknown; statusCode?: unknown };
  if (typeof maybe.status === "number") return maybe.status;
  if (typeof maybe.statusCode === "number") return maybe.statusCode;
  return undefined;
}

function shouldTryNextModel(err: unknown): boolean {
  const status = getErrorStatus(err);
  if (status === 400 || status === 401 || status === 403) return false;
  if (status === 404 || status === 408 || status === 409 || status === 425 || status === 429) return true;
  if (typeof status === "number" && status >= 500) return true;
  const message = String((err as { message?: unknown })?.message ?? "").toLowerCase();
  return (
    message.includes("not found") ||
    message.includes("quota") ||
    message.includes("rate") ||
    message.includes("resource exhausted") ||
    message.includes("unavailable") ||
    message.includes("timeout") ||
    message.includes("internal")
  );
}

async function generateSuggestions(ai: GoogleGenAI, prompt: string): Promise<string> {
  let lastError: unknown;
  for (const modelName of FALLBACK_MODELS) {
    try {
      const result = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          responseMimeType: "application/json",
        },
      });

      if (!result.text) throw new Error("Empty response from AI");
      return result.text;
    } catch (err: unknown) {
      lastError = err;
      if (!shouldTryNextModel(err)) throw err;
    }
  }
  throw lastError ?? new Error("All fallback models failed");
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest): Promise<NextResponse> {
  // 1. Auth
  const { user, error: authError } = await requireUser();
  if (authError) return authError as NextResponse;

  // 2. Rate limit — 10 req/min (AI suggestion calls are heavy)
  const { limited, error: rateLimitError } = rateLimit(`/api/gemini/deck-suggest:${user.id}`, {
    max: 10,
    windowMs: 60_000,
    meta: { endpoint: "/api/gemini/deck-suggest", userId: user.id },
  });
  if (limited) return rateLimitError as NextResponse;

  // 3. Validate body
  const { data: body, error: validationError } = await validateBody(request, DeckSuggestSchema);
  if (validationError) return validationError as NextResponse;

  const difficulty = body.difficulty ?? 1;
  const description = body.deckDescription ?? "";

  // 4. Check cache (skip when seed or existingWords are present — those need fresh/varied results)
  const hasVariance = !!body.seed || (body.existingWords && body.existingWords.length > 0);
  if (!hasVariance) {
    const cacheKey = buildCacheKey(body.deckName, description, difficulty);
    const cached = await getCached(cacheKey);
    if (cached) {
      return NextResponse.json({ suggestions: cached, cached: true });
    }
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AI service unavailable" }, { status: 503 });
  }

  // 5. Build prompt server-side from validated fields only
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
    const ai = new GoogleGenAI({ apiKey });
    const raw = await generateSuggestions(ai, prompt);
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);

    // 6. Store in cache (only when no variance factors — seed/existingWords make results specific)
    if (!hasVariance && parsed.suggestions) {
      const cacheKey = buildCacheKey(body.deckName, description, difficulty);
      setCached(cacheKey, parsed.suggestions).catch(() => {});
    }

    return NextResponse.json(parsed);
  } catch (err: unknown) {
    const status = getErrorStatus(err) ?? 500;
    const message = String((err as { message?: unknown })?.message ?? "Internal server error");
    console.error("deck-suggest error:", err);
    return NextResponse.json({ error: message }, { status });
  }
}
