import { createHash } from "crypto";
import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, rateLimit, validateBody } from "@/lib/api/guards";

// Separate endpoint for transcribing full spoken sentences (e.g. interview responses).
// Differences from /api/gemini/transcribe:
//   - Accepts up to ~4.5 MB base64 (~30s of audio)
//   - maxOutputTokens: 300 (enough for multi-sentence answers)
//   - Prompt asks for the complete sentence, not a single word

const ALLOWED_AUDIO_MIME_TYPES = new Set([
  "audio/webm",
  "audio/ogg",
  "audio/wav",
  "audio/mp4",
  "audio/mpeg",
  "audio/aac",
  "audio/flac",
  "audio/opus",
  "audio/webm;codecs=opus",
  "audio/ogg;codecs=opus",
]);

const TranscribeSentenceSchema = z.object({
  audioDataUrl: z
    .string()
    .min(1)
    .max(6_000_000, "Audio payload too large")
    .refine((v) => v.startsWith("data:audio/"), {
      message: "audioDataUrl must be an audio data URI",
    }),
});

const ENABLE_PREVIEW_MODELS = process.env.GEMINI_ENABLE_PREVIEW_MODELS === "true";
const BASE_MODELS = ["gemini-2.5-flash-lite", "gemini-2.5-flash", "gemini-flash-latest"] as const;
const PREVIEW_MODELS = ["gemini-3.1-flash-lite-preview"] as const;
const FALLBACK_MODELS = ENABLE_PREVIEW_MODELS ? [...BASE_MODELS, ...PREVIEW_MODELS] : [...BASE_MODELS];

const PROMPT =
  "Transcribe this spoken English sentence exactly as heard. Return ONLY the words, no punctuation, no commentary, no formatting. If unintelligible, return an empty string.";

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
  const msg = String((err as { message?: unknown })?.message ?? "").toLowerCase();
  return msg.includes("quota") || msg.includes("rate") || msg.includes("unavailable") || msg.includes("timeout");
}

function parseDataUrl(dataUrl: string): { mimeType: string; base64Data: string } {
  const match = dataUrl.match(/^data:([^;,]+(?:;[^,]+)?);base64,(.+)$/);
  if (!match) throw new Error("Invalid audio data URL");
  const mimeType = match[1].toLowerCase();
  if (!ALLOWED_AUDIO_MIME_TYPES.has(mimeType)) throw new Error(`Unsupported audio format: ${mimeType}`);
  return { mimeType, base64Data: match[2] };
}

// Simple in-memory cache — same audio blob = same transcript
const cache = new Map<string, string>();

async function transcribe(ai: GoogleGenAI, mimeType: string, base64Data: string): Promise<string> {
  const key = createHash("sha256").update(mimeType).update(base64Data).digest("hex");
  const cached = cache.get(key);
  if (cached !== undefined) return cached;

  let lastError: unknown;
  for (const modelName of FALLBACK_MODELS) {
    try {
      const result = await ai.models.generateContent({
        model: modelName,
        contents: [
          { text: PROMPT },
          { inlineData: { mimeType, data: base64Data } },
        ],
        config: { temperature: 0, maxOutputTokens: 300 },
      });
      const transcript = (result.text ?? "").trim();
      if (cache.size > 200) cache.delete(cache.keys().next().value!);
      cache.set(key, transcript);
      return transcript;
    } catch (err: unknown) {
      lastError = err;
      if (!shouldTryNextModel(err)) throw err;
    }
  }
  throw lastError ?? new Error("All fallback models failed");
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { user, error: authError } = await requireUser();
  if (authError) return authError as NextResponse;

  const { limited, error: rateLimitError } = rateLimit(`/api/gemini/transcribe-sentence:${user.id}`, {
    max: 20,
    windowMs: 60_000,
    meta: { endpoint: "/api/gemini/transcribe-sentence", userId: user.id },
  });
  if (limited) return rateLimitError as NextResponse;

  const { data: body, error: validationError } = await validateBody(request, TranscribeSentenceSchema);
  if (validationError) return validationError as NextResponse;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "AI service unavailable" }, { status: 503 });

  try {
    const { mimeType, base64Data } = parseDataUrl(body.audioDataUrl);
    const ai = new GoogleGenAI({ apiKey });
    const transcript = await transcribe(ai, mimeType, base64Data);
    return NextResponse.json({ transcript });
  } catch (err: unknown) {
    const status = getErrorStatus(err) ?? 500;
    const message = String((err as { message?: unknown })?.message ?? "Internal server error");
    console.error("transcribe-sentence error:", err);
    return NextResponse.json({ error: message }, { status });
  }
}
