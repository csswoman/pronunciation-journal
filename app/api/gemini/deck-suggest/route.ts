import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

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

const SYSTEM_PROMPT = `You are an English vocabulary coach. When given a deck name and optional description, suggest 8 relevant English words or short phrases that fit the theme. Return ONLY valid JSON with no markdown, no code fences, no extra text — just raw JSON.

Format:
{"suggestions":[{"word":"example","meaning":"brief definition or usage context"}]}`;

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

async function generateSuggestions(
  ai: GoogleGenAI,
  prompt: string
): Promise<string> {
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

      if (!result.text) {
        throw new Error("Gemini returned an empty response");
      }

      return result.text;
    } catch (err: unknown) {
      lastError = err;
      if (!shouldTryNextModel(err)) throw err;
    }
  }
  throw lastError ?? new Error("All fallback models failed");
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  const { deckName, deckDescription, difficulty, seed } = await request.json();
  if (!deckName) {
    return NextResponse.json({ error: "deckName is required" }, { status: 400 });
  }

  // Tailor prompt by difficulty and seed. Difficulty is optional and may request
  // more advanced vocabulary when >= 2.
  const difficultyHint = (typeof difficulty === "number" && difficulty >= 2)
    ? "Use more advanced / less common vocabulary appropriate for an intermediate to advanced learner."
    : "Use common to intermediate vocabulary appropriate for learners.";

  const seedHint = seed ? `Use this seed to vary results: ${String(seed)}.` : "";

  const prompt = deckDescription
    ? `Deck: "${deckName}"\nDescription: "${deckDescription}"\n\n${difficultyHint} ${seedHint}\nSuggest 8 English words or short phrases for this theme.`
    : `Deck: "${deckName}"\n\n${difficultyHint} ${seedHint}\nSuggest 8 English words or short phrases for this theme.`;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const raw = await generateSuggestions(ai, prompt);

    // Strip markdown code fences if model adds them
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return NextResponse.json(parsed);
  } catch (err: unknown) {
    const status = getErrorStatus(err) ?? 500;
    const message = String((err as { message?: unknown })?.message ?? "Internal server error");
    console.error("deck-suggest error:", err);
    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}
