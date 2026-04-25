import { createHash } from "crypto";
import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, rateLimit, validateBody } from "@/lib/api/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Request schema
// ---------------------------------------------------------------------------

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

const TranscribeSchema = z.object({
  audioDataUrl: z
    .string()
    .min(1)
    .max(2_000_000, "Audio payload too large") // ~1.5 MB base64
    .refine((v) => v.startsWith("data:audio/"), {
      message: "audioDataUrl must be an audio data URI",
    }),
  targetWord: z.string().max(100).optional(),
});

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

// ---------------------------------------------------------------------------
// In-memory cache (L1)
// ---------------------------------------------------------------------------

const TRANSCRIBE_CACHE_TTL_MS = 1000 * 60 * 60 * 6;
const MAX_TRANSCRIBE_CACHE_ENTRIES = 400;
const transcribeCache = new Map<string, { transcript: string; createdAt: number }>();

const SUPABASE_STT_CACHE_TABLE = "stt_transcription_cache";

type SttCacheRow = {
  cache_key: string;
  target_word: string | null;
  mime_type: string;
  transcript: string;
  payload_size: number;
  updated_at: string;
};

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

function parseDataUrl(dataUrl: string): { mimeType: string; base64Data: string } {
  const match = dataUrl.match(/^data:([^;,]+(?:;[^,]+)?);base64,(.+)$/);
  if (!match) throw new Error("Invalid audio data URL");
  const mimeType = match[1].toLowerCase();
  if (!ALLOWED_AUDIO_MIME_TYPES.has(mimeType)) {
    throw new Error(`Unsupported audio format: ${mimeType}`);
  }
  return { mimeType, base64Data: match[2] };
}

function buildCacheKey(targetWord: string | undefined, mimeType: string, base64Data: string): string {
  return createHash("sha256")
    .update(`${targetWord ?? ""}|${mimeType}|`)
    .update(base64Data)
    .digest("hex");
}

function getL1Cached(key: string): string | null {
  const cached = transcribeCache.get(key);
  if (!cached) return null;
  if (Date.now() - cached.createdAt > TRANSCRIBE_CACHE_TTL_MS) {
    transcribeCache.delete(key);
    return null;
  }
  return cached.transcript;
}

function setL1Cache(key: string, transcript: string): void {
  if (transcribeCache.size >= MAX_TRANSCRIBE_CACHE_ENTRIES) {
    const oldest = transcribeCache.keys().next().value;
    if (oldest) transcribeCache.delete(oldest);
  }
  transcribeCache.set(key, { transcript, createdAt: Date.now() });
}

// ---------------------------------------------------------------------------
// Supabase STT cache — uses the user's session client (RLS enforced)
// ---------------------------------------------------------------------------

async function getL2Cached(key: string): Promise<string | null> {
  try {
    const supabase = await createSupabaseServerClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const { data, error } = await db
      .from(SUPABASE_STT_CACHE_TABLE)
      .select("transcript, updated_at")
      .eq("cache_key", key)
      .maybeSingle() as { data: Pick<SttCacheRow, "transcript" | "updated_at"> | null; error: unknown };

    if (error || !data) return null;

    const ageMs = Date.now() - new Date(data.updated_at).getTime();
    if (Number.isFinite(ageMs) && ageMs > TRANSCRIBE_CACHE_TTL_MS) {
      void db.from(SUPABASE_STT_CACHE_TABLE).delete().eq("cache_key", key);
      return null;
    }

    return data.transcript;
  } catch {
    return null;
  }
}

async function setL2Cache(
  key: string,
  transcript: string,
  targetWord: string | undefined,
  mimeType: string,
  payloadSize: number
): Promise<void> {
  try {
    const supabase = await createSupabaseServerClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from(SUPABASE_STT_CACHE_TABLE).upsert(
      {
        cache_key: key,
        target_word: targetWord ?? null,
        mime_type: mimeType,
        transcript,
        payload_size: payloadSize,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "cache_key" }
    );
  } catch {
    // Cache write is non-critical; ignore failures silently
  }
}

// ---------------------------------------------------------------------------
// Transcription
// ---------------------------------------------------------------------------

async function transcribeWithFallback(
  ai: GoogleGenAI,
  mimeType: string,
  base64Data: string,
  targetWord?: string
): Promise<string> {
  let lastError: unknown;
  const prompt = targetWord
    ? `Transcribe this short English pronunciation attempt. Target word: "${targetWord}". Return ONLY the recognized words in plain text. If unintelligible, return an empty string.`
    : "Transcribe this short English pronunciation attempt. Return ONLY the recognized words in plain text. If unintelligible, return an empty string.";

  for (const modelName of FALLBACK_MODELS) {
    try {
      const result = await ai.models.generateContent({
        model: modelName,
        contents: [
          { text: prompt },
          { inlineData: { mimeType, data: base64Data } },
        ],
        config: { temperature: 0, maxOutputTokens: 24 },
      });
      return (result.text ?? "").trim();
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

  // 2. Rate limit — tighter for transcription (costs more per call)
  const { limited, error: rateLimitError } = rateLimit(`/api/gemini/transcribe:${user.id}`, {
    max: 20,
    windowMs: 60_000,
    meta: { endpoint: "/api/gemini/transcribe", userId: user.id },
  });
  if (limited) return rateLimitError as NextResponse;

  // 3. Validate body
  const { data: body, error: validationError } = await validateBody(request, TranscribeSchema);
  if (validationError) return validationError as NextResponse;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AI service unavailable" }, { status: 503 });
  }

  try {
    const { mimeType, base64Data } = parseDataUrl(body.audioDataUrl);
    const cacheKey = buildCacheKey(body.targetWord, mimeType, base64Data);

    // L1 in-memory cache
    const l1 = getL1Cached(cacheKey);
    if (l1 !== null) return NextResponse.json({ transcript: l1, cached: true });

    // L2 Supabase cache
    const l2 = await getL2Cached(cacheKey);
    if (l2 !== null) {
      setL1Cache(cacheKey, l2);
      return NextResponse.json({ transcript: l2, cached: true, source: "supabase" });
    }

    // Call Gemini
    const ai = new GoogleGenAI({ apiKey });
    const transcript = await transcribeWithFallback(ai, mimeType, base64Data, body.targetWord);

    setL1Cache(cacheKey, transcript);
    void setL2Cache(cacheKey, transcript, body.targetWord, mimeType, base64Data.length);

    return NextResponse.json({ transcript });
  } catch (err: unknown) {
    const status = getErrorStatus(err) ?? 500;
    const message = String((err as { message?: unknown })?.message ?? "Internal server error");
    console.error("gemini transcribe error:", err);
    return NextResponse.json({ error: message }, { status });
  }
}
