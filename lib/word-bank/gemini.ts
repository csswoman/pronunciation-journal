import { GoogleGenAI } from "@google/genai";
import type { WordEnrichment } from "@/lib/types";

const ENABLE_PREVIEW_MODELS = process.env.GEMINI_ENABLE_PREVIEW_MODELS === "true";
const BASE_MODELS = [
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
  "gemini-flash-latest",
] as const;
const PREVIEW_MODELS = ["gemini-3.1-flash-lite-preview"] as const;
const FALLBACK_MODELS: readonly string[] = ENABLE_PREVIEW_MODELS
  ? [...BASE_MODELS, ...PREVIEW_MODELS]
  : [...BASE_MODELS];

const SYSTEM_PROMPT = `You are an English learning assistant for Spanish speakers.

Given a word and optional context, return a JSON with:

- meaning: simple definition (A2-B1 level English)
- translation: Spanish translation
- ipa: phonetic transcription (IPA)
- example_sentence: short, natural sentence
- synonyms: array of max 3 synonyms
- image_prompt: short visual description

Rules:
- Keep explanations simple
- If context exists, adapt the example
- Return ONLY valid JSON
- No extra text, no markdown, no code fences`;

function getErrorStatus(err: unknown): number | undefined {
  if (!err || typeof err !== "object") return undefined;
  const maybe = err as { status?: unknown; statusCode?: unknown };
  if (typeof maybe.status === "number") return maybe.status;
  if (typeof maybe.statusCode === "number") return maybe.statusCode;
  return undefined;
}

function isRetryableApiError(err: unknown): boolean {
  const status = getErrorStatus(err);
  if (typeof status === "number") return status >= 500 || status === 408 || status === 409 || status === 425 || status === 429;

  const message = String((err as { message?: unknown })?.message ?? "").toLowerCase();
  return (
    message.includes("quota") ||
    message.includes("rate") ||
    message.includes("resource exhausted") ||
    message.includes("unavailable") ||
    message.includes("timeout") ||
    message.includes("internal")
  );
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

function buildPrompt(text: string, context?: string | null): string {
  const ctx = context?.trim() ? context.trim() : "";
  return `Word: "${text}"\nContext: "${ctx}"`;
}

function parseEnrichment(raw: string): WordEnrichment {
  const cleaned = raw
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  const jsonText = jsonMatch?.[0] ?? cleaned;

  const parsed = JSON.parse(jsonText) as Record<string, unknown>;

  const synonymsValue = parsed.synonyms;
  const synonyms = Array.isArray(synonymsValue)
    ? synonymsValue.filter((s): s is string => typeof s === "string").slice(0, 3)
    : [];

  return {
    meaning: typeof parsed.meaning === "string" ? parsed.meaning : "",
    translation: typeof parsed.translation === "string" ? parsed.translation : "",
    ipa: typeof parsed.ipa === "string" ? parsed.ipa : "",
    example: typeof parsed.example_sentence === "string" ? parsed.example_sentence : "",
    synonyms,
    image_prompt: typeof parsed.image_prompt === "string" ? parsed.image_prompt : "",
  };
}

async function callGeminiOnce(
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

function isParseError(err: unknown): boolean {
  return err instanceof SyntaxError || String((err as { message?: unknown })?.message ?? "").includes("No JSON object");
}

export async function enrichWithGemini(
  text: string,
  context?: string | null
): Promise<WordEnrichment> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

  const ai = new GoogleGenAI({ apiKey });
  const prompt = buildPrompt(text, context);

  try {
    const raw = await callGeminiOnce(ai, prompt);
    return parseEnrichment(raw);
  } catch (err) {
    if (!isParseError(err) && !isRetryableApiError(err)) throw err;
    console.warn("[word-bank] enrich attempt 1 failed, retrying:", err);
    const raw = await callGeminiOnce(ai, prompt);
    return parseEnrichment(raw);
  }
}
