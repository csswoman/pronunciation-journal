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
import { AUDIO_MODELS, buildSpeechCacheKey, generateMissionSpeech } from "@/lib/gemini/audio";
import { recordSharedCacheHit } from "@/lib/ai-usage/budget";
import { logServerError } from "@/lib/api/logging";
import { getErrorStatus } from "@/lib/gemini/fallback";

export const maxDuration = 60;

const RequestSchema = z
  .object({
    lineId: z.string().min(1).max(150),
    lineText: z.string().min(1).max(2000),
    missionId: z.string().min(1).max(150).optional(),
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
    endpoint: "/api/gemini/mission-audio",
    maxPermanent: 60,
    maxAnonymous: 5,
  });
  if (limited) return rateLimitError as NextResponse;

  const { data: body, error: validationError } = await validateBody(request, RequestSchema);
  if (validationError) return validationError;

  try {
    const supabase = await createSupabaseServerClient();
    const storageClient = tryGetSupabaseAdminClient() ?? supabase;
    const voice = body.voice ?? "Puck";

    const isCatalogMission = body.missionId?.startsWith("scripted.");
    const feature = "/api/gemini/mission-audio";

    const cachedAudio = (await Promise.all(AUDIO_MODELS.map(async (model) => {
      const cacheKey = buildSpeechCacheKey(feature, body.lineText, voice, model);
      const cachePath = isCatalogMission
        ? `catalog/${cacheKey}.wav`
        : `users/${user.id}/${cacheKey}.wav`;
      const folder = cachePath.slice(0, cachePath.lastIndexOf("/"));
      const fileName = cachePath.slice(cachePath.lastIndexOf("/") + 1);
      const { data: existingFiles } = await storageClient.storage
        .from("mission-audio")
        .list(folder, { search: fileName, limit: 5 })
        .catch(() => ({ data: null }));
      if (existingFiles?.some((file) => file.name === fileName)) {
        const { data: publicData } = storageClient.storage.from("mission-audio").getPublicUrl(cachePath);
        return publicData.publicUrl;
      }
      return null;
    }))).find((url): url is string => Boolean(url));
    if (cachedAudio) {
      void recordSharedCacheHit(feature);
      return NextResponse.json({ audioUrl: cachedAudio }, { headers: SECURE_HEADERS });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return publicErrorResponse(503, "AI audio service is currently unavailable");

    let modelUsed: string | undefined;
    const wavBuffer = await generateMissionSpeech(apiKey, body.lineText, {
      voice,
      feature,
      onModelUsed: (model) => { modelUsed = model; },
    });
    if (!modelUsed) throw new Error("TTS response did not identify its model");
    const cacheKey = buildSpeechCacheKey(feature, body.lineText, voice, modelUsed);
    const storagePath = isCatalogMission
      ? `catalog/${cacheKey}.wav`
      : `users/${user.id}/${cacheKey}.wav`;

    // 3. Upload WAV audio to Supabase Storage
    const { error: uploadError } = await storageClient.storage
      .from("mission-audio")
      .upload(storagePath, wavBuffer, {
        contentType: "audio/wav",
        upsert: true,
      });

    if (uploadError) {
      logServerError(`Mission audio upload failed: ${uploadError.message}`, uploadError, {
        endpoint: "/api/gemini/mission-audio",
        operation: "upload",
        userId: user.id,
      });
      return publicErrorResponse(500, "Failed to save generated audio file");
    }

    const { data: publicData } = storageClient.storage
      .from("mission-audio")
      .getPublicUrl(storagePath);

    return NextResponse.json({ audioUrl: publicData.publicUrl }, { headers: SECURE_HEADERS });
  } catch (err) {
    logServerError("Mission audio generation error", err, {
      endpoint: "/api/gemini/mission-audio",
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
    return publicErrorResponse(500, "Failed to generate mission line audio");
  }
}
