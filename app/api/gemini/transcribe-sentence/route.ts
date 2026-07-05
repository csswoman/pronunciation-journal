import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSameOrigin, requireUser, rateLimit, validateBody, publicErrorResponse } from "@/lib/api/guards";
import { callWithFallback, getErrorStatus } from "@/lib/gemini/client";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logServerError } from "@/lib/api/logging";

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
const cache = new Map<string, { transcript: string; createdAt: number }>();
const SENTENCE_TRANSCRIPTION_CACHE_TABLE = "sentence_transcription_cache";

type SentenceTranscriptionCacheRow = {
  transcript: string;
  updated_at: string;
};

function buildCacheKey(userId: string, mimeType: string, base64Data: string): string {
  return createHash("sha256").update(userId).update(mimeType).update(base64Data).digest("hex");
}

function getL1Cached(key: string): string | null {
  const cached = cache.get(key);
  if (!cached) return null;
  if (Date.now() - cached.createdAt > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return cached.transcript;
}

function setL1Cache(key: string, transcript: string): void {
  if (cache.size >= MAX_CACHE_ENTRIES) cache.delete(cache.keys().next().value!);
  cache.set(key, { transcript, createdAt: Date.now() });
}

async function getL2Cached(userId: string, key: string): Promise<string | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from(SENTENCE_TRANSCRIPTION_CACHE_TABLE)
      .select("transcript, updated_at")
      .eq("user_id", userId)
      .eq("cache_key", key)
      .maybeSingle() as { data: SentenceTranscriptionCacheRow | null; error: unknown };

    if (error || !data) return null;

    const ageMs = Date.now() - new Date(data.updated_at).getTime();
    if (Number.isFinite(ageMs) && ageMs > CACHE_TTL_MS) {
      await supabase
        .from(SENTENCE_TRANSCRIPTION_CACHE_TABLE)
        .delete()
        .eq("user_id", userId)
        .eq("cache_key", key);
      return null;
    }

    return data.transcript;
  } catch {
    return null;
  }
}

async function setL2Cache(
  userId: string,
  key: string,
  transcript: string,
  mimeType: string,
  payloadSize: number
): Promise<void> {
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.from(SENTENCE_TRANSCRIPTION_CACHE_TABLE).upsert(
      {
        user_id: userId,
        cache_key: key,
        mime_type: mimeType,
        transcript,
        payload_size: payloadSize,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,cache_key" }
    );
  } catch {
    // Cache writes must not fail transcription.
  }
}

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
    const key = buildCacheKey(user.id, mimeType, base64Data);

    const l1 = getL1Cached(key);
    if (l1 !== null) {
      return NextResponse.json({ transcript: l1, cached: true });
    }

    const l2 = await getL2Cached(user.id, key);
    if (l2 !== null) {
      setL1Cache(key, l2);
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

    setL1Cache(key, transcript);
    await setL2Cache(user.id, key, transcript, mimeType, base64Data.length);

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
