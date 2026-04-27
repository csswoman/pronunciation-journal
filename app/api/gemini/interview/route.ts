import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, rateLimit, validateBody } from "@/lib/api/guards";

const InterviewSchema = z.object({
  scenario: z.enum(["hr", "frontend", "system-design", "behavioral", "product"]),
  level: z.enum(["beginner", "intermediate", "advanced"]),
});

const SYSTEM_PROMPT = `You are an interview script generator for English language learners. Generate a realistic mock interview script with 6 rounds (question + model answer).

Rules:
- Interviewer questions must be natural and conversational
- Candidate answers must be in natural spoken English (not written/formal)
- Adjust vocabulary complexity to the requested level
- beginner: simple sentences, common words, short answers
- intermediate: clear professional language, moderate complexity
- advanced: idiomatic expressions, nuanced vocabulary, longer answers
- Return ONLY valid JSON, no markdown, no code fences

Format:
{
  "title": "Interview title",
  "turns": [
    {"role": "interviewer", "text": "..."},
    {"role": "candidate", "text": "..."},
    ...
  ]
}

Include exactly 12 turns (6 interviewer + 6 candidate, alternating, starting with interviewer).`;

const ENABLE_PREVIEW_MODELS = process.env.GEMINI_ENABLE_PREVIEW_MODELS === "true";
const BASE_MODELS = ["gemini-2.5-flash-lite", "gemini-2.5-flash", "gemini-flash-latest"] as const;
const PREVIEW_MODELS = ["gemini-3.1-flash-lite-preview"] as const;
const FALLBACK_MODELS = ENABLE_PREVIEW_MODELS ? [...BASE_MODELS, ...PREVIEW_MODELS] : [...BASE_MODELS];

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

async function generateScript(ai: GoogleGenAI, prompt: string): Promise<string> {
  let lastError: unknown;
  for (const modelName of FALLBACK_MODELS) {
    try {
      const result = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: { systemInstruction: SYSTEM_PROMPT, responseMimeType: "application/json" },
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

const SCENARIO_LABELS: Record<string, string> = {
  hr: "HR / General Interview",
  frontend: "Frontend Developer Interview",
  "system-design": "System Design Interview",
  behavioral: "Behavioral Interview (STAR method)",
  product: "Product Manager Interview",
};

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { user, error: authError } = await requireUser();
  if (authError) return authError as NextResponse;

  const { limited, error: rateLimitError } = rateLimit(`/api/gemini/interview:${user.id}`, {
    max: 10,
    windowMs: 60_000,
    meta: { endpoint: "/api/gemini/interview", userId: user.id },
  });
  if (limited) return rateLimitError as NextResponse;

  const { data: body, error: validationError } = await validateBody(request, InterviewSchema);
  if (validationError) return validationError as NextResponse;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "AI service unavailable" }, { status: 503 });

  const prompt = `Generate a ${SCENARIO_LABELS[body.scenario]} script for a ${body.level} English learner. Make the interviewer professional and the candidate responses natural spoken English at ${body.level} level.`;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const raw = await generateScript(ai, prompt);
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return NextResponse.json(parsed);
  } catch (err: unknown) {
    const status = getErrorStatus(err) ?? 500;
    const message = String((err as { message?: unknown })?.message ?? "Internal server error");
    console.error("interview error:", err);
    return NextResponse.json({ error: message }, { status });
  }
}
