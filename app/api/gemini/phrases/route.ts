import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, rateLimit, validateBody, SECURE_HEADERS } from "@/lib/api/guards";

const PhrasesSchema = z.object({
  exclude: z.array(z.string().max(200)).max(100).optional(),
}).strict();

const SYSTEM_PROMPT = `You are an English pronunciation coach. Generate 10 natural English sentences for pronunciation practice. Requirements:
- Conversational, not textbook-stiff
- Mix of everyday, professional, and social contexts
- Vary sentence length (5–12 words each)
- Include phonetically challenging sounds: TH, R, W, V, SH, vowel reductions
- Never generate the same sentence twice across calls

Return ONLY valid JSON, no markdown, no code fences:
{"phrases":["sentence one","sentence two",...]}`;

const BASE_MODELS = ["gemini-2.5-flash-lite", "gemini-2.5-flash", "gemini-flash-latest"] as const;
const ENABLE_PREVIEW = process.env.GEMINI_ENABLE_PREVIEW_MODELS === "true";
const FALLBACK_MODELS = ENABLE_PREVIEW
  ? [...BASE_MODELS, "gemini-3.1-flash-lite-preview"]
  : [...BASE_MODELS];

function getErrorStatus(err: unknown): number | undefined {
  if (!err || typeof err !== "object") return undefined;
  const m = err as { status?: unknown; statusCode?: unknown };
  if (typeof m.status === "number") return m.status;
  if (typeof m.statusCode === "number") return m.statusCode;
  return undefined;
}

function shouldTryNextModel(err: unknown): boolean {
  const s = getErrorStatus(err);
  if (s === 400 || s === 401 || s === 403) return false;
  if (s === 404 || s === 408 || s === 429) return true;
  if (typeof s === "number" && s >= 500) return true;
  const msg = String((err as { message?: unknown })?.message ?? "").toLowerCase();
  return msg.includes("quota") || msg.includes("rate") || msg.includes("unavailable") || msg.includes("timeout");
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { user, error: authError } = await requireUser();
  if (authError) return authError as NextResponse;

  const { limited, error: rateLimitError } = rateLimit(`/api/gemini/phrases:${user.id}`, {
    max: 10,
    windowMs: 60_000,
    meta: { endpoint: "/api/gemini/phrases", userId: user.id },
  });
  if (limited) return rateLimitError as NextResponse;

  const { data: body, error: validationError } = await validateBody(request, PhrasesSchema);
  if (validationError) return validationError as NextResponse;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "AI service unavailable" }, { status: 503, headers: SECURE_HEADERS });

  const excludeHint = body?.exclude?.length
    ? `Do NOT generate any of these phrases:\n${body.exclude.slice(0, 20).map(p => `- ${p}`).join("\n")}`
    : "";

  const prompt = `Generate 10 English pronunciation practice sentences. ${excludeHint}`;

  let lastError: unknown;
  const ai = new GoogleGenAI({ apiKey });

  for (const model of FALLBACK_MODELS) {
    try {
      const result = await ai.models.generateContent({
        model,
        contents: prompt,
        config: { systemInstruction: SYSTEM_PROMPT, responseMimeType: "application/json" },
      });
      if (!result.text) throw new Error("Empty response");
      const cleaned = result.text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(cleaned) as { phrases?: unknown };
      if (!Array.isArray(parsed.phrases)) throw new Error("Invalid response shape");
      return NextResponse.json({ phrases: parsed.phrases }, { headers: SECURE_HEADERS });
    } catch (err: unknown) {
      lastError = err;
      if (!shouldTryNextModel(err)) break;
    }
  }

  const msg = String((lastError as { message?: unknown })?.message ?? "Failed to generate phrases");
  return NextResponse.json({ error: msg }, { status: 500, headers: SECURE_HEADERS });
}
