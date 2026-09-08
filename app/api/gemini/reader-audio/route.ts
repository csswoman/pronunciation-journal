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
import { generateReaderSpeech } from "@/lib/gemini/audio";
import {
  getPassageAudioServer,
  updatePassageAudioServer,
} from "@/lib/practice/reader/server-queries";
import { logServerError } from "@/lib/api/logging";

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

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return publicErrorResponse(503, "AI audio service is currently unavailable");
  }

  try {
    const supabase = await createSupabaseServerClient();
    const storagePath = `${user.id}/${body.passageId}.wav`;

    // 1. Idempotency / cache check: If audio already exists in DB or Storage, return it
    const existingDbRecord = await getPassageAudioServer(body.passageId, user.id).catch(() => null);
    if (existingDbRecord?.audioUrl) {
      return NextResponse.json({ audioUrl: existingDbRecord.audioUrl }, { headers: SECURE_HEADERS });
    }

    // If text to speak is not provided, read it from the database record
    const textToRead = (body.passageText ?? existingDbRecord?.passage ?? "").trim();
    if (!textToRead) {
      return publicErrorResponse(400, "Passage text is missing or not found");
    }

    // 2. Generate high-fidelity speech audio via Gemini TTS
    const wavBuffer = await generateReaderSpeech(apiKey, textToRead, {
      voice: body.voice ?? "Puck",
    });

    // 3. Upload WAV audio to Supabase Storage
    const storageClient = tryGetSupabaseAdminClient() ?? supabase;
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
    return publicErrorResponse(500, "Failed to generate reading audio");
  }
}
