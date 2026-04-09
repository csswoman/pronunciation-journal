import { createHash } from "crypto";
import { GoogleGenAI } from "@google/genai";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

interface TranscribeBody {
  audioDataUrl?: string;
  targetWord?: string;
}

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
  hit_count: number;
  created_at: string;
  updated_at: string;
};

let supabaseAdminClient: SupabaseClient | null = null;

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
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new Error("Invalid audio data URL");
  }
  return {
    mimeType: match[1],
    base64Data: match[2],
  };
}

function buildTranscribeCacheKey(targetWord: string | undefined, mimeType: string, base64Data: string): string {
  return createHash("sha256")
    .update(`${targetWord ?? ""}|${mimeType}|`)
    .update(base64Data)
    .digest("hex");
}

function getCachedTranscription(key: string): string | null {
  const cached = transcribeCache.get(key);
  if (!cached) return null;
  if (Date.now() - cached.createdAt > TRANSCRIBE_CACHE_TTL_MS) {
    transcribeCache.delete(key);
    return null;
  }
  return cached.transcript;
}

function setCachedTranscription(key: string, transcript: string): void {
  if (transcribeCache.size >= MAX_TRANSCRIBE_CACHE_ENTRIES) {
    const oldest = transcribeCache.keys().next().value;
    if (oldest) transcribeCache.delete(oldest);
  }
  transcribeCache.set(key, { transcript, createdAt: Date.now() });
}

function getSupabaseAdminClient(): SupabaseClient | null {
  if (supabaseAdminClient) return supabaseAdminClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRole) {
    return null;
  }

  supabaseAdminClient = createClient(url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return supabaseAdminClient;
}

async function getCachedTranscriptionFromSupabase(key: string): Promise<string | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from(SUPABASE_STT_CACHE_TABLE)
    .select("cache_key, transcript, updated_at")
    .eq("cache_key", key)
    .maybeSingle<Pick<SttCacheRow, "cache_key" | "transcript" | "updated_at">>();

  if (error) {
    console.warn("[STT cache] Supabase read failed:", error.message);
    return null;
  }
  if (!data) return null;

  const ageMs = Date.now() - new Date(data.updated_at).getTime();
  if (Number.isFinite(ageMs) && ageMs > TRANSCRIBE_CACHE_TTL_MS) {
    // Fire-and-forget cleanup for expired rows.
    void supabase.from(SUPABASE_STT_CACHE_TABLE).delete().eq("cache_key", key);
    return null;
  }

  return data.transcript;
}

async function saveCachedTranscriptionToSupabase(
  key: string,
  transcript: string,
  targetWord: string | undefined,
  mimeType: string,
  payloadSize: number
): Promise<void> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return;

  const { error } = await supabase.from(SUPABASE_STT_CACHE_TABLE).upsert(
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

  if (error) {
    console.warn("[STT cache] Supabase write failed:", error.message);
  }
}

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
          {
            inlineData: {
              mimeType,
              data: base64Data,
            },
          },
        ],
        config: {
          temperature: 0,
          maxOutputTokens: 24,
        },
      });

      return (result.text ?? "").trim();
    } catch (err: unknown) {
      lastError = err;
      if (!shouldTryNextModel(err)) throw err;
    }
  }

  throw lastError ?? new Error("All fallback models failed");
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  try {
    const body: TranscribeBody = await request.json();
    if (!body.audioDataUrl) {
      return NextResponse.json({ error: "audioDataUrl is required" }, { status: 400 });
    }

    const { mimeType, base64Data } = parseDataUrl(body.audioDataUrl);
    const cacheKey = buildTranscribeCacheKey(body.targetWord, mimeType, base64Data);
    const cached = getCachedTranscription(cacheKey);
    if (cached !== null) {
      return NextResponse.json({ transcript: cached, cached: true });
    }

    const cachedFromSupabase = await getCachedTranscriptionFromSupabase(cacheKey);
    if (cachedFromSupabase !== null) {
      setCachedTranscription(cacheKey, cachedFromSupabase);
      return NextResponse.json({ transcript: cachedFromSupabase, cached: true, source: "supabase" });
    }

    const ai = new GoogleGenAI({ apiKey });
    const transcript = await transcribeWithFallback(ai, mimeType, base64Data, body.targetWord);
    setCachedTranscription(cacheKey, transcript);
    await saveCachedTranscriptionToSupabase(
      cacheKey,
      transcript,
      body.targetWord,
      mimeType,
      base64Data.length
    );
    return NextResponse.json({ transcript });
  } catch (err: unknown) {
    const status = getErrorStatus(err) ?? 500;
    const message = String((err as { message?: unknown })?.message ?? "Internal server error");
    console.error("gemini transcribe error:", err);
    return NextResponse.json({ error: message }, { status });
  }
}
