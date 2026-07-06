import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSameOrigin, requireUser, rateLimit, validateBody, publicErrorResponse } from "@/lib/api/guards";
import { callWithFallback, getErrorStatus } from "@/lib/gemini/client";
import { logServerError } from "@/lib/api/logging";
import { buildTranscriptionCacheKey, createTranscriptionCache } from "@/lib/gemini/transcription-cache";

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

const PROMPT =
  "Transcribe this spoken English sentence exactly as heard. Return ONLY the words, no punctuation, no commentary, no formatting. If unintelligible, return an empty string.";

function parseDataUrl(dataUrl: string): { mimeType: string; base64Data: string } {
  const match = dataUrl.match(/^data:([^;,]+(?:;[^,]+)?);base64,(.+)$/);
  if (!match) throw new Error("Invalid audio data URL");
  const mimeType = match[1].toLowerCase();
  if (!ALLOWED_AUDIO_MIME_TYPES.has(mimeType)) throw new Error(`Unsupported audio format: ${mimeType}`);
  return { mimeType, base64Data: match[2] };
}

const CACHE_TTL_MS = 1000 * 60 * 60 * 6;
const MAX_CACHE_ENTRIES = 200;
const transcriptionCache = createTranscriptionCache({
  table: "sentence_transcription_cache",
  ttlMs: CACHE_TTL_MS,
  maxEntries: MAX_CACHE_ENTRIES,
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const { user, error: authError } = await requireUser(request);
  if (authError) return authError as NextResponse;

  const { limited, error: rateLimitError } = await rateLimit(`/api/gemini/transcribe-sentence:${user.id}`, {
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
    const key = buildTranscriptionCacheKey([user.id, mimeType, base64Data]);

    const l1 = transcriptionCache.getL1(key);
    if (l1 !== null) {
      return NextResponse.json({ transcript: l1, cached: true });
    }

    const l2 = await transcriptionCache.getL2(user.id, key);
    if (l2 !== null) {
      transcriptionCache.setL1(key, l2);
      return NextResponse.json({ transcript: l2, cached: true, source: "supabase" });
    }

    const transcript = await callWithFallback(
      apiKey,
      {
        contents: [
          { text: PROMPT },
          { inlineData: { mimeType, data: base64Data } },
        ],
        config: { temperature: 0, maxOutputTokens: 300 },
      },
      (text) => text.trim(),
      { timeoutMs: 45_000 }
    );

    transcriptionCache.setL1(key, transcript);
    await transcriptionCache.setL2(user.id, key, transcript, mimeType, base64Data.length, {});

    return NextResponse.json({ transcript });
  } catch (err: unknown) {
    const status = getErrorStatus(err) ?? 500;
    logServerError("Sentence transcription failed", err, {
      endpoint: "/api/gemini/transcribe-sentence",
      operation: "transcribe",
      status,
      userId: user.id,
    });
    return publicErrorResponse(status >= 500 ? 500 : status, "Failed to transcribe sentence");
  }
}
