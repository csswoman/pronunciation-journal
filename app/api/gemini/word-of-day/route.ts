import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const FALLBACK_MODELS = ["gemini-2.5-flash-lite", "gemini-2.5-flash", "gemini-flash-latest"] as const;

const SYSTEM_PROMPT = `You are an English vocabulary coach. Generate a single interesting English word suitable for language learners. Return ONLY valid JSON with no markdown, no code fences, no extra text.

Format:
{"word":"example","ipa":"/ɪɡˈzæm.pəl/","definition":"a brief, clear definition","example_sentence":"A short example sentence using the word.","difficulty":"intermediate"}

difficulty must be one of: beginner, intermediate, advanced`;

function getDateSeed(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;
}

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
  if (status === 404 || status === 408 || status === 429) return true;
  if (typeof status === "number" && status >= 500) return true;
  const message = String((err as { message?: unknown })?.message ?? "").toLowerCase();
  return message.includes("quota") || message.includes("rate") || message.includes("unavailable");
}

const THEMES = [
  "nature", "emotions", "science", "art", "travel", "food", "technology",
  "philosophy", "music", "history", "sports", "architecture", "literature",
  "medicine", "business", "law", "psychology", "astronomy", "politics", "fashion",
];

function pickTheme(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return THEMES[hash % THEMES.length];
}

async function generateWord(ai: GoogleGenAI, seed: string): Promise<string> {
  const theme = pickTheme(seed);
  let lastError: unknown;
  for (const modelName of FALLBACK_MODELS) {
    try {
      const result = await ai.models.generateContent({
        model: modelName,
        contents: `Generate one interesting English word related to the theme "${theme}". Seed: ${seed}. Pick a word that is specific and useful for language learners — avoid very common words.`,
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

// Cache in-memory per process (resets on cold start, good enough for edge/serverless)
let cachedDate = "";
let cachedWord: object | null = null;

export async function GET(request: NextRequest): Promise<NextResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AI service unavailable" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get("refresh") === "1";
  const seed = forceRefresh
    ? `${getDateSeed()}-${Date.now()}`
    : getDateSeed();

  if (!forceRefresh && cachedDate === seed && cachedWord) {
    return NextResponse.json(cachedWord, {
      headers: { "Cache-Control": "public, max-age=3600" },
    });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const raw = await generateWord(ai, seed);
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let parsed: object;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("word-of-day JSON parse failed. Raw response:", raw);
      return NextResponse.json({ error: "Invalid response from AI" }, { status: 502 });
    }

    if (!forceRefresh) {
      cachedDate = getDateSeed();
      cachedWord = parsed;
    }

    return NextResponse.json(parsed, {
      headers: { "Cache-Control": forceRefresh ? "no-store" : "public, max-age=3600" },
    });
  } catch (err: unknown) {
    const status = getErrorStatus(err) ?? 500;
    const message = String((err as { message?: unknown })?.message ?? "Internal server error");
    console.error("word-of-day error:", { status, message, err });
    return NextResponse.json({ error: message }, { status });
  }
}
