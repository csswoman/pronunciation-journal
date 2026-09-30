import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  requireSameOrigin,
  requireUser,
  checkLayeredRateLimit,
  validateBody,
  publicErrorResponse,
  SECURE_HEADERS,
} from "@/lib/api/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { tryGetSupabaseAdminClient } from "@/lib/supabase/service-role";
import { AUDIO_MODELS, buildSpeechCacheKey, generateReaderSpeech } from "@/lib/gemini/audio";
import { recordSharedCacheHit } from "@/lib/ai-usage/budget";
import {
  getPassageAudioServer,
  updatePassageAudioServer,
} from "@/lib/practice/reader/server-queries";
import { logServerError } from "@/lib/api/logging";
import { getErrorStatus } from "@/lib/gemini/fallback";

export const maxDuration = 60;

const RequestSchema = z
  .object({
    passageId: z.string().min(1).max(100),
    passageText: z.string().min(5).max(5000).optional(),
    voice: z.enum(["Puck", "Charon", "Kore", "Fenrir", "Aoede"]).optional(),
  })
  .strict();

export async function POST(request: NextRequest): Promise<NextResponse> {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const { user, error: authError } = await requireUser(request);
  if (authError) return authError as NextResponse;

  const { limited, error: rateLimitError } = await checkLayeredRateLimit({
    request,
    user,
    endpoint: "/api/gemini/reader-audio",
    maxPermanent: 15,
    maxAnonymous: 3,
  });
  if (limited) return rateLimitError as NextResponse;

  const { data: body, error: validationError } = await validateBody(request, RequestSchema);
  if (validationError) return validationError;

  try {
    const supabase = await createSupabaseServerClient();
    const storageClient = tryGetSupabaseAdminClient() ?? supabase;
    const voice = body.voice ?? "Puck";

    // Load canonical text, then resolve only cache entries for the requested voice/model.
    const existingDbRecord = await getPassageAudioServer(body.passageId, user.id).catch(() => null);
    const textToRead = (body.passageText ?? existingDbRecord?.passage ?? "").trim();
    if (!textToRead) {
      return publicErrorResponse(400, "Passage text is missing or not found");
    }

    const cachedAudio = (await Promise.all(AUDIO_MODELS.map(async (model) => {
      const cachePath = `${user.id}/${buildSpeechCacheKey("/api/gemini/reader-audio", textToRead, voice, model)}.wav`;
      const folder = cachePath.slice(0, cachePath.lastIndexOf("/"));
      const fileName = cachePath.slice(cachePath.lastIndexOf("/") + 1);
      const { data: existingFiles } = await storageClient.storage
        .from("reader-audio")
        .list(folder, { search: fileName, limit: 5 })
        .catch(() => ({ data: null }));
      if (existingFiles?.some((file) => file.name === fileName)) {
        const { data: publicData } = storageClient.storage.from("reader-audio").getPublicUrl(cachePath);
        return publicData.publicUrl;
      }
      return null;
    }))).find((url): url is string => Boolean(url));
    if (cachedAudio) {
      void recordSharedCacheHit("/api/gemini/reader-audio");
      if (existingDbRecord?.audioUrl !== cachedAudio) {
        void updatePassageAudioServer(body.passageId, user.id, cachedAudio).catch(() => undefined);
      }
      return NextResponse.json({ audioUrl: cachedAudio }, { headers: SECURE_HEADERS });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return publicErrorResponse(503, "AI audio service is currently unavailable");

    let modelUsed: string | undefined;
    const wavBuffer = await generateReaderSpeech(apiKey, textToRead, {
      voice,
      feature: "/api/gemini/reader-audio",
      onModelUsed: (model) => { modelUsed = model; },
    });
    if (!modelUsed) throw new Error("TTS response did not identify its model");
    const storagePath = `${user.id}/${buildSpeechCacheKey("/api/gemini/reader-audio", textToRead, voice, modelUsed)}.wav`;

    // 3. Upload WAV audio to Supabase Storage
    const { error: uploadError } = await storageClient.storage
      .from("reader-audio")
      .upload(storagePath, wavBuffer, {
        contentType: "audio/wav",
        upsert: true,
      });

    if (uploadError) {
      logServerError(`Reader audio upload failed: ${uploadError.message}`, uploadError, {
        endpoint: "/api/gemini/reader-audio",
        operation: "upload",
        userId: user.id,
      });
      return publicErrorResponse(500, "Failed to save generated audio file");
    }

    const { data: publicData } = storageClient.storage
      .from("reader-audio")
      .getPublicUrl(storagePath);
    const audioUrl = publicData.publicUrl;

    // 4. Update passage record with the audioUrl (best-effort if row exists in DB)
    if (existingDbRecord) {
      await updatePassageAudioServer(body.passageId, user.id, audioUrl).catch((err) => {
        logServerError("Failed updating passage audioUrl in DB", err, {
          endpoint: "/api/gemini/reader-audio",
          operation: "updateDb",
          userId: user.id,
        });
      });
    }

    return NextResponse.json({ audioUrl }, { headers: SECURE_HEADERS });
  } catch (err) {
    logServerError("Reader audio generation error", err, {
      endpoint: "/api/gemini/reader-audio",
      operation: "generateAudio",
      userId: user.id,
    });
    const status = getErrorStatus(err) ?? 500;
    if (status === 429) {
      return publicErrorResponse(429, "La cuota diaria de audio de IA está agotada. Vuelve a intentarlo después de medianoche del Pacífico.");
    }
    if (status === 503 || status === 504) {
      return publicErrorResponse(status, "El audio HD está ocupado. Usa la voz del dispositivo o vuelve a intentarlo en unos segundos.");
    }
    return publicErrorResponse(500, "Failed to generate reading audio");
  }
}
