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
import { generateMissionSpeech } from "@/lib/gemini/audio";
import { logServerError } from "@/lib/api/logging";

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

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return publicErrorResponse(503, "AI audio service is currently unavailable");
  }

  try {
    const supabase = await createSupabaseServerClient();
    const storageClient = tryGetSupabaseAdminClient() ?? supabase;

    // Determine storage location: catalog authored lines vs user generated lines
    const isCatalogMission = body.missionId?.startsWith("scripted.");
    const safeLineId = body.lineId.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = isCatalogMission
      ? `catalog/${safeLineId}.wav`
      : `users/${user.id}/${safeLineId}.wav`;

    const folder = storagePath.substring(0, storagePath.lastIndexOf("/"));
    const fileName = storagePath.substring(storagePath.lastIndexOf("/") + 1);

    // 1. Idempotency / cache check: If audio already exists in Storage, return it immediately
    const { data: existingFiles } = await storageClient.storage
      .from("mission-audio")
      .list(folder, { search: fileName, limit: 5 })
      .catch(() => ({ data: null }));

    if (existingFiles?.some((f) => f.name === fileName)) {
      const { data: publicData } = storageClient.storage
        .from("mission-audio")
        .getPublicUrl(storagePath);
      return NextResponse.json({ audioUrl: publicData.publicUrl }, { headers: SECURE_HEADERS });
    }

    // 2. Generate high-fidelity speech audio via Gemini TTS
    const wavBuffer = await generateMissionSpeech(apiKey, body.lineText, {
      voice: body.voice ?? "Puck",
    });

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
    return publicErrorResponse(500, "Failed to generate mission line audio");
  }
}
