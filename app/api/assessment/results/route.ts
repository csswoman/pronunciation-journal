import { NextRequest, NextResponse } from "next/server";
import { requireSameOrigin, requireUser, rateLimit, validateBody, SECURE_HEADERS, publicErrorResponse } from "@/lib/api/guards";
import { getAssessmentProfileLevel, persistAssessmentOutcome } from "@/lib/courses/assessment-queries";
import { AssessmentResultSchema } from "@/lib/courses/assessment-schema";
import { logServerError } from "@/lib/api/logging";
import { scoreAssessment, ASSESSMENT_LEVEL_ORDER } from "@/lib/courses/assessment";
import { buildServerAssessment } from "@/lib/courses/server-assessment";
import {
  getAssessmentOralAttempt,
  markAssessmentOralAttemptCompleted,
  parseAssessmentOralAnswers,
} from "@/lib/courses/assessment-oral-queries";
import type { CefrLevelId } from "@/lib/courses/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const originError = requireSameOrigin(req);
  if (originError) return originError;

  const { user, error: authError } = await requireUser(req);
  if (authError) return authError;

  const { limited, error: rateLimitError } = await rateLimit(`/api/assessment/results:${user.id}`, {
    max: 30,
    windowMs: 60_000,
    meta: { endpoint: "/api/assessment/results", userId: user.id },
  });
  if (limited) return rateLimitError;

  const { data: body, error: validationError } = await validateBody(req, AssessmentResultSchema);
  if (validationError) return validationError;

  if (!body.answers && !body.assessmentAttemptId) {
    return publicErrorResponse(400, "answers required");
  }

  const checkpointLevel = body.checkpointLevel ?? body.evaluatedLevel ?? undefined;
  const evaluatedLevels = body.evaluatedLevels
    ?? (body.mode === "placement" && body.evaluatedLevel
      ? ASSESSMENT_LEVEL_ORDER.slice(0, ASSESSMENT_LEVEL_ORDER.indexOf(body.evaluatedLevel) + 1)
      : undefined);

  if (body.mode === "checkpoint") {
    if (!checkpointLevel) {
      return publicErrorResponse(400, "Checkpoint level required");
    }

    let userLevel: string;
    try {
      userLevel = await getAssessmentProfileLevel(user.id);
    } catch (error) {
      logServerError("Assessment checkpoint level lookup failed", error, {
        endpoint: "/api/assessment/results",
        operation: "lookupLearnerLevel",
        userId: user.id,
      });
      return publicErrorResponse(503, "Could not verify checkpoint level");
    }

    const currentIdx = ASSESSMENT_LEVEL_ORDER.indexOf(userLevel as CefrLevelId);
    const targetIdx = ASSESSMENT_LEVEL_ORDER.indexOf(checkpointLevel as CefrLevelId);
    if (targetIdx < 0 || targetIdx - (currentIdx >= 0 ? currentIdx : 0) > 1) {
      return publicErrorResponse(400, "Checkpoint level exceeds allowed progression limit");
    }
  }

  if (body.assessmentAttemptId && body.mode !== "checkpoint") {
    return publicErrorResponse(400, "Oral assessment attempts are only valid for checkpoints");
  }

  try {
    let assessmentAttempt = null;
    let authoritativeAnswers = body.answers ?? {};
    let oralEvidencePassed = false;
    if (body.assessmentAttemptId) {
      assessmentAttempt = await getAssessmentOralAttempt(user.id, body.assessmentAttemptId);
      if (!assessmentAttempt) return publicErrorResponse(404, "Assessment attempt not found");
      if (assessmentAttempt.level !== checkpointLevel) {
        return publicErrorResponse(400, "Assessment attempt level mismatch");
      }
      if (assessmentAttempt.expires_at <= new Date().toISOString()) {
        return publicErrorResponse(410, "Assessment attempt expired");
      }
      if (assessmentAttempt.status === "oral_processing") {
        return publicErrorResponse(409, "Oral evidence is being checked");
      }
      if (assessmentAttempt.status === "expired") {
        return publicErrorResponse(410, "Assessment attempt expired");
      }
      authoritativeAnswers = parseAssessmentOralAnswers(assessmentAttempt.answers);
      oralEvidencePassed = assessmentAttempt.status === "oral_passed"
        || assessmentAttempt.status === "completed";
    }

    const { questions, concepts } = buildServerAssessment(body.mode, checkpointLevel, evaluatedLevels);
    const serverResult = scoreAssessment(
      questions,
      authoritativeAnswers,
      body.mode,
      checkpointLevel,
      concepts,
      body.selfRatings ?? {},
      oralEvidencePassed,
    );

    if (body.result) {
      if (
        body.result.assignedLevel !== serverResult.assignedLevel ||
        body.result.score !== serverResult.score ||
        body.result.passed !== serverResult.passed ||
        body.result.listeningScore !== serverResult.listeningScore ||
        body.result.listeningTotal !== serverResult.listeningTotal
      ) {
        logServerError("Client assessment result differs from server rescore", new Error("Rescore mismatch"), {
          endpoint: "/api/assessment/results",
          userId: user.id,
          operation: "rescoreMismatch",
        });
      }
    }

    if (assessmentAttempt?.status !== "completed") {
      await persistAssessmentOutcome(
        user.id,
        body.mode,
        serverResult,
        body.mode === "checkpoint"
          ? checkpointLevel
          : serverResult.evaluatedLevels?.at(-1),
      );
      if (assessmentAttempt?.status === "oral_passed") {
        await markAssessmentOralAttemptCompleted(user.id, assessmentAttempt.id);
      }
    }
    return NextResponse.json({ ok: true, result: serverResult }, { headers: SECURE_HEADERS });
  } catch (error) {
    logServerError("Assessment result save failed", error, {
      endpoint: "/api/assessment/results",
      operation: "persistAssessmentOutcome",
      userId: user.id,
    });
    return publicErrorResponse(500, "Failed to save assessment result");
  }
}
