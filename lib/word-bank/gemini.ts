import { GoogleGenAI } from "@google/genai";
import type { WordEnrichment } from "@/lib/word-bank/types";

import { FALLBACK_MODELS, getFastThinkingConfig } from "@/lib/gemini/fallback";
import { filterAvailable, markCooldownFromError } from "@/lib/gemini/cooldown";
import { recordModelFailure, recordModelSuccess, reserveModel } from "@/lib/ai-usage/budget";

const SYSTEM_PROMPT = `You are an English learning assistant for Spanish speakers.

Given a word and optional context, return a JSON with:

- meaning: simple definition (A2-B1 level English)
- translation: Spanish translation
- ipa: phonetic transcription (IPA)
- example_sentence: short, natural sentence where the word appears in a meaningful context — the surrounding words must give enough clues that a language learner could guess the missing word. Avoid placing the word right after an article with no other context (e.g. "The ___ is good" is bad; "She made such a kind gesture" is good).
- synonyms: array of max 3 synonyms
- image_prompt: short visual description

Rules:
- Keep explanations simple
- If context exists, adapt the example
- Return ONLY valid JSON
- No extra text, no markdown, no code fences`;

const LOOKUP_SYSTEM_PROMPT = `You are an English learning assistant for Spanish speakers.

Given one English word, return JSON with only:
- meaning: one simple A2-B1 English definition
- translation: the most useful Spanish translation

Rules:
- Do not use the learner's sentence or invent an example
- Keep both values short
- Return ONLY valid JSON, no markdown or code fences`;

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

async function callGeminiOnce<T>(
  ai: GoogleGenAI,
  prompt: string,
  parse: (raw: string) => T,
  systemInstruction = SYSTEM_PROMPT,
  feature = "word-bank-enrichment",
): Promise<T> {
  let lastError: unknown;
  let budgetDenied = false;
  const deadlineAt = Date.now() + 25_000;
  for (const modelName of filterAvailable(FALLBACK_MODELS).slice(0, 2)) {
    if (Date.now() >= deadlineAt) break;
    if (!(await reserveModel(modelName, feature))) {
      budgetDenied = true;
      continue;
    }
    const startedAt = Date.now();
    try {
      const thinkingConfig = getFastThinkingConfig(modelName);
      const remainingMs = Math.max(1, Math.min(12_000, deadlineAt - Date.now()));
      const result = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          ...(thinkingConfig ? { thinkingConfig } : {}),
          httpOptions: { timeout: remainingMs },
          abortSignal: AbortSignal.timeout(remainingMs),
        },
      });

      if (!result.text) {
        throw new Error("Gemini returned an empty response");
      }
      const parsed = parse(result.text);
      void recordModelSuccess(modelName, feature, Date.now() - startedAt);
      return parsed;
    } catch (err: unknown) {
      lastError = err;
      markCooldownFromError(modelName, err);
      void recordModelFailure(modelName, feature, getErrorStatus(err), String((err as { name?: unknown })?.name ?? "error"), Date.now() - startedAt);
      if (Date.now() >= deadlineAt) break;
      if (!shouldTryNextModel(err)) throw err;
    }
  }
  if (budgetDenied && !lastError) {
    throw Object.assign(new Error("Daily AI model budget exhausted"), { status: 429 });
  }
  if (Date.now() >= deadlineAt) {
    throw Object.assign(new Error("Gemini word-bank request timed out after 25000ms"), { status: 504 });
  }
  throw lastError ?? new Error("All fallback models failed");
}

export async function enrichWithGemini(
  text: string,
  context?: string | null
): Promise<WordEnrichment> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

  const ai = new GoogleGenAI({ apiKey });
  const prompt = buildPrompt(text, context);

  return callGeminiOnce(ai, prompt, parseEnrichment);
}

/** Low-cost Reader lookup. Extra WordEnrichment fields intentionally stay empty. */
export async function lookupWordWithGemini(text: string): Promise<WordEnrichment> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

  const ai = new GoogleGenAI({ apiKey });
  const prompt = `Word: "${text}"`;

  return callGeminiOnce(ai, prompt, parseEnrichment, LOOKUP_SYSTEM_PROMPT, "word-bank-lookup");
}
