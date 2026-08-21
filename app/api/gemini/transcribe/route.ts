import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSameOrigin, requireUser, checkLayeredRateLimit, validateBody, publicErrorResponse } from "@/lib/api/guards";
import { buildTranscriptionPrompt } from "@/lib/ai-prompts";
import { getErrorStatus, shouldTryNextModel, FALLBACK_MODELS } from "@/lib/gemini/fallback";
import { withGeminiTimeout } from "@/lib/gemini/client";
import { logServerError } from "@/lib/api/logging";
import { buildTranscriptionCacheKey, createTranscriptionCache } from "@/lib/gemini/transcription-cache";

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
// In-memory cache (L1)
// ---------------------------------------------------------------------------

const TRANSCRIBE_CACHE_TTL_MS = 1000 * 60 * 60 * 6;
const MAX_TRANSCRIBE_CACHE_ENTRIES = 400;
const transcriptionCache = createTranscriptionCache<{ targetWord?: string }>({
  table: "stt_transcription_cache",
  ttlMs: TRANSCRIBE_CACHE_TTL_MS,
  maxEntries: MAX_TRANSCRIBE_CACHE_ENTRIES,
  buildExtraRow: ({ targetWord }) => ({ target_word: targetWord ?? null }),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseDataUrl(dataUrl: string): { mimeType: string; base64Data: string } {
  const match = dataUrl.match(/^data:([^;,]+(?:;[^,]+)?);base64,(.+)$/);
  if (!match) throw new Error("Invalid audio data URL");
  const mimeType = match[1].toLowerCase();
  if (!ALLOWED_AUDIO_MIME_TYPES.has(mimeType)) {
    throw new Error(`Unsupported audio format: ${mimeType}`);
  }
  return { mimeType, base64Data: match[2] };
}

async function transcribeWithFallback(
  ai: GoogleGenAI,
  mimeType: string,
  base64Data: string,
  targetWord?: string
): Promise<string> {
  let lastError: unknown;
  const prompt = buildTranscriptionPrompt(targetWord);

  for (const modelName of FALLBACK_MODELS) {
    try {
      const result = await withGeminiTimeout(
        ai.models.generateContent({
          model: modelName,
          contents: [
            { text: prompt },
            { inlineData: { mimeType, data: base64Data } },
          ],
          config: { temperature: 0, maxOutputTokens: 24 },
        }),
        45_000
      );
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
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  // 1. Auth
  const { user, error: authError } = await requireUser(request);
  if (authError) return authError as NextResponse;

  // 2. Layered rate limit — tighter for transcription (costs more per call)
  const { limited, error: rateLimitError } = await checkLayeredRateLimit({
    request,
    user,
    endpoint: "/api/gemini/transcribe",
    maxPermanent: 20,
    maxAnonymous: 3,
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
    const cacheKey = buildTranscriptionCacheKey([user.id, body.targetWord, mimeType, base64Data]);

    // L1 in-memory cache
    const l1 = transcriptionCache.getL1(cacheKey);
    if (l1 !== null) return NextResponse.json({ transcript: l1, cached: true });

    // L2 Supabase cache
    const l2 = await transcriptionCache.getL2(user.id, cacheKey);
    if (l2 !== null) {
      transcriptionCache.setL1(cacheKey, l2);
      return NextResponse.json({ transcript: l2, cached: true, source: "supabase" });
    }

    // Call Gemini
    const ai = new GoogleGenAI({ apiKey });
    const transcript = await transcribeWithFallback(ai, mimeType, base64Data, body.targetWord);

    transcriptionCache.setL1(cacheKey, transcript);
    await transcriptionCache.setL2(user.id, cacheKey, transcript, mimeType, base64Data.length, {
      targetWord: body.targetWord,
    });

    return NextResponse.json({ transcript });
  } catch (err: unknown) {
    const status = getErrorStatus(err) ?? 500;
    logServerError("Word transcription failed", err, {
      endpoint: "/api/gemini/transcribe",
      operation: "transcribe",
      status,
      userId: user.id,
    });
    return publicErrorResponse(status >= 500 ? 500 : status, "Transcription failed");
  }
}
