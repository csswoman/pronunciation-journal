import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSameOrigin, requireUser, rateLimit, checkDailyAiUserLimit, SECURE_HEADERS, publicErrorResponse } from "@/lib/api/guards";
import { logServerError } from "@/lib/api/logging";
import { getErrorStatus } from "@/lib/gemini/client";
import { getAssessmentProfileLevel, persistAssessmentOutcome, savePendingOralAssessmentResult } from "@/lib/courses/assessment-queries";
import { scoreAssessment } from "@/lib/courses/assessment";
import { buildServerAssessment } from "@/lib/courses/server-assessment";
import {
  acceptAssessmentOralEvidence,
  claimAssessmentOralChallenge,
  getAssessmentOralAttempt,
  markAssessmentOralAttemptCompleted,
  parseAssessmentOralAnswers,
  recoverExpiredAssessmentOralChallenges,
  releaseAssessmentOralChallenge,
  resetAssessmentOralChallenge,
  type StoredAssessmentOralAttempt,
} from "@/lib/courses/assessment-oral-queries";
import { findAssessmentOralTask, scoreAssessmentOralTranscript } from "@/lib/courses/assessment-oral-tasks";
import { transcribeAssessmentOralAudio } from "@/lib/courses/assessment-oral-transcription";
import { ASSESSMENT_ORAL_AUDIO_MAX_BYTES } from "@/lib/courses/assessment-oral-shared";
import { AssessmentPayloadSchema } from "@/lib/courses/assessment-schema";

export const runtime = "nodejs";
export const maxDuration = 60;

const ALLOWED_AUDIO_TYPES = new Set(["audio/webm", "audio/ogg", "audio/mp4"]);

function isAudioFile(value: FormDataEntryValue | null): value is File {
  return value !== null && typeof value !== "string" && typeof value.arrayBuffer === "function";
}

async function finalizeAcceptedAttempt(
  userId: string,
  attempt: StoredAssessmentOralAttempt,
): Promise<NextResponse> {
  const { questions } = buildServerAssessment("checkpoint", attempt.level as "a1" | "a2");
  const result = scoreAssessment(
    questions,
    parseAssessmentOralAnswers(attempt.answers),
    "checkpoint",
    attempt.level as "a1" | "a2",
    [],
    {},
    true,
  );
  const parsed = AssessmentPayloadSchema.safeParse(result);
  if (!parsed.success || !result.passed) throw new Error("Accepted oral checkpoint could not be finalized");

  if (attempt.status === "oral_passed") {
    await persistAssessmentOutcome(userId, "checkpoint", result, attempt.level as "a1" | "a2");
    await markAssessmentOralAttemptCompleted(userId, attempt.id);
  }
  return NextResponse.json({ passed: true, result }, { headers: SECURE_HEADERS });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const originError = requireSameOrigin(request);
  if (originError) return originError;
  const { user, error: authError } = await requireUser(request);
  if (authError) return authError;
  const { limited, error: rateLimitError } = await rateLimit(`/api/assessment/oral/evidence:${user.id}`, {
    max: 8,
    windowMs: 60_000,
    meta: { endpoint: "/api/assessment/oral/evidence", userId: user.id },
  });
  if (limited) return rateLimitError;
  const dailyLimit = await checkDailyAiUserLimit(user, "/api/assessment/oral/evidence");
  if (dailyLimit.limited) return dailyLimit.error;

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > ASSESSMENT_ORAL_AUDIO_MAX_BYTES + 65_536) {
    return publicErrorResponse(413, "Audio recording is too large");
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return publicErrorResponse(400, "Audio recording payload is invalid");
  }
  const attemptId = formData.get("attemptId");
  const challengeId = formData.get("challengeId");
  const audioFile = formData.get("audio");
  const parsedAttemptId = z.string().uuid().safeParse(attemptId);
  const parsedChallengeId = z.string().uuid().safeParse(challengeId);
  if (
    !parsedAttemptId.success
    || !parsedChallengeId.success
    || !isAudioFile(audioFile)
  ) return publicErrorResponse(400, "Attempt, challenge, and audio are required");
  if (audioFile.size === 0) return publicErrorResponse(400, "Audio recording is empty");
  if (audioFile.size > ASSESSMENT_ORAL_AUDIO_MAX_BYTES) return publicErrorResponse(413, "Audio recording is too large");
  const mimeType = audioFile.type.split(";")[0].trim().toLowerCase();
  if (!ALLOWED_AUDIO_TYPES.has(mimeType)) return publicErrorResponse(415, "Audio format is not supported");

  let claimed: StoredAssessmentOralAttempt | null = null;
  const validatedAttemptId = parsedAttemptId.data;
  const validatedChallengeId = parsedChallengeId.data;
  try {
    const audioBytes = Buffer.from(await audioFile.arrayBuffer());
    const audioSha256 = createHash("sha256").update(audioBytes).digest("hex");
    const saved = await getAssessmentOralAttempt(user.id, validatedAttemptId);
    if (!saved) return publicErrorResponse(404, "Saved oral checkpoint not found");
    if (saved.expires_at <= new Date().toISOString()) return publicErrorResponse(410, "Saved oral checkpoint expired");
    if ((saved.status === "oral_passed" || saved.status === "completed")
      && saved.challenge_id === validatedChallengeId
      && saved.oral_audio_sha256 === audioSha256) {
      return finalizeAcceptedAttempt(user.id, saved);
    }
    const currentLevel = await getAssessmentProfileLevel(user.id);
    const levels = ["a1", "a2", "b1", "b2", "c1", "c2"];
    const currentIndex = levels.indexOf(currentLevel);
    const attemptIndex = levels.indexOf(saved.level);
    if (currentIndex >= 0 && attemptIndex >= 0 && currentIndex > attemptIndex + 1) {
      return publicErrorResponse(409, "The learner level changed after this oral checkpoint was saved");
    }
    if (saved.status === "oral_pending" || saved.status === "oral_processing") {
      const { questions } = buildServerAssessment("checkpoint", saved.level as "a1" | "a2");
      const pendingResult = scoreAssessment(
        questions,
        parseAssessmentOralAnswers(saved.answers),
        "checkpoint",
        saved.level as "a1" | "a2",
      );
      await savePendingOralAssessmentResult(user.id, saved.id, saved.level as "a1" | "a2", pendingResult);
    }
    if (saved.status === "oral_processing") {
      if (saved.challenge_expires_at && saved.challenge_expires_at <= new Date().toISOString()) {
        await recoverExpiredAssessmentOralChallenges(user.id, saved.level as "a1" | "a2", new Date().toISOString());
        return publicErrorResponse(409, "El reto oral venció. Prepara otro para este mismo intento.");
      }
      return NextResponse.json({ processing: true, message: "El audio todavía se está evaluando. Espera un momento y vuelve a consultar." }, {
        status: 202,
        headers: SECURE_HEADERS,
      });
    }
    claimed = await claimAssessmentOralChallenge({
      userId: user.id,
      attemptId: validatedAttemptId,
      challengeId: validatedChallengeId,
      now: new Date().toISOString(),
    });
    if (!claimed?.item_id) return publicErrorResponse(409, "This oral challenge expired or was already used");

    const transcript = await transcribeAssessmentOralAudio(audioBytes, mimeType);
    const task = findAssessmentOralTask(claimed.item_id);
    if (!task) throw new Error("Oral challenge task was not found");
    if (!scoreAssessmentOralTranscript(claimed.item_id, transcript)) {
      await resetAssessmentOralChallenge({ userId: user.id, attemptId: validatedAttemptId, challengeId: validatedChallengeId });
      return NextResponse.json({
        passed: false,
        retryable: true,
        message: "No pudimos verificar todos los detalles pedidos. Tu parte escrita y auditiva sigue guardada; puedes grabar otra respuesta.",
      }, { headers: SECURE_HEADERS });
    }

    const accepted = await acceptAssessmentOralEvidence({
      userId: user.id,
      attemptId: validatedAttemptId,
      challengeId: validatedChallengeId,
      audioSha256,
      rubricVersion: task.rubricVersion,
      completedAt: new Date().toISOString(),
    });
    if (accepted.errorCode) {
      await resetAssessmentOralChallenge({ userId: user.id, attemptId: validatedAttemptId, challengeId: validatedChallengeId });
      if (accepted.errorCode === "23505") {
        return publicErrorResponse(409, "This recording was already used for oral checkpoint evidence");
      }
      throw new Error(`Oral evidence could not be accepted (${accepted.errorCode})`);
    }
    if (!accepted.attempt) return publicErrorResponse(409, "Oral checkpoint changed while it was being checked");
    return await finalizeAcceptedAttempt(user.id, accepted.attempt);
  } catch (error) {
    if (claimed) {
      try {
        await releaseAssessmentOralChallenge({ userId: user.id, attemptId: validatedAttemptId, challengeId: validatedChallengeId });
      } catch {
        /* Keep the original failure; an expired processing attempt cannot promote. */
      }
    }
    logServerError("Oral checkpoint evaluation failed", error, {
      endpoint: "/api/assessment/oral/evidence",
      operation: "evaluateAudio",
      userId: user.id,
    });
    if (getErrorStatus(error) === 429) {
      return publicErrorResponse(503, "La transcripción está ocupada por ahora. Tu audio sigue disponible para reintentar.");
    }
    if (error instanceof Error && error.message.toLowerCase().includes("timeout")) {
      return publicErrorResponse(504, "La transcripción tardó demasiado. Tu audio sigue disponible para reintentar.");
    }
    return publicErrorResponse(503, "No se pudo comprobar el audio. Tu checkpoint sigue pendiente; vuelve a intentarlo.");
  }
}
