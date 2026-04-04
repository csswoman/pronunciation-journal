import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const FALLBACK_MODELS = [
  "models/gemini-2.5-flash",
  "models/gemini-2.0-flash",
  "models/gemini-flash-latest",
  "models/gemini-2.5-flash-lite",
  "models/gemini-2.0-flash-lite",
];

const SYSTEM_PROMPT = `You are an English vocabulary coach. When given a deck name and optional description, suggest 8 relevant English words or short phrases that fit the theme. Return ONLY valid JSON with no markdown, no code fences, no extra text — just raw JSON.

Format:
{"suggestions":[{"word":"example","meaning":"brief definition or usage context"}]}`;

async function generateSuggestions(
  genAI: GoogleGenerativeAI,
  prompt: string
): Promise<string> {
  let lastError: unknown;
  for (const modelName of FALLBACK_MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: SYSTEM_PROMPT,
      });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (err: any) {
      lastError = err;
      if (err.status === 404 || err.message?.includes("not found")) continue;
      throw err;
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
    const genAI = new GoogleGenerativeAI(apiKey);
    const raw = await generateSuggestions(genAI, prompt);

    // Strip markdown code fences if model adds them
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return NextResponse.json(parsed);
  } catch (err: any) {
    console.error("deck-suggest error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
