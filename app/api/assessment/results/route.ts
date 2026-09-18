import { NextRequest, NextResponse } from "next/server";
import { requireSameOrigin, requireUser, rateLimit, validateBody, SECURE_HEADERS, publicErrorResponse } from "@/lib/api/guards";
import { persistAssessmentOutcome } from "@/lib/courses/assessment-queries";
import { AssessmentResultSchema } from "@/lib/courses/assessment-schema";
import { logServerError } from "@/lib/api/logging";
import { scoreAssessment, ASSESSMENT_LEVEL_ORDER } from "@/lib/courses/assessment";
import { buildServerAssessment } from "@/lib/courses/server-assessment";
import { tryGetSupabaseAdminClient } from "@/lib/supabase/service-role";
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

  if (!body.answers) {
    return publicErrorResponse(400, "answers required");
  }

  const checkpointLevel = body.checkpointLevel ?? body.evaluatedLevel ?? undefined;

  if (body.mode === "checkpoint") {
    if (!checkpointLevel) {
      return publicErrorResponse(400, "Checkpoint level required");
    }

    const admin = tryGetSupabaseAdminClient();
    let userLevel: string = "a1";
    if (admin) {
      const { data: profile } = await admin
        .from("user_profiles")
        .select("cefr_level")
        .eq("id", user.id)
        .maybeSingle();
      if (profile?.cefr_level) {
        userLevel = profile.cefr_level.toLowerCase();
      }
    }

    const currentIdx = ASSESSMENT_LEVEL_ORDER.indexOf(userLevel as CefrLevelId);
    const targetIdx = ASSESSMENT_LEVEL_ORDER.indexOf(checkpointLevel as CefrLevelId);
    if (targetIdx < 0 || targetIdx - (currentIdx >= 0 ? currentIdx : 0) > 1) {
      return publicErrorResponse(400, "Checkpoint level exceeds allowed progression limit");
    }
  }

  try {
    const { questions, concepts } = buildServerAssessment(body.mode, checkpointLevel);
    const serverResult = scoreAssessment(
      questions,
      body.answers,
      body.mode,
      checkpointLevel,
      concepts,
      body.selfRatings ?? {},
    );

    if (body.result) {
      if (
        body.result.assignedLevel !== serverResult.assignedLevel ||
        body.result.score !== serverResult.score ||
        body.result.passed !== serverResult.passed
      ) {
        logServerError("Client assessment result differs from server rescore", new Error("Rescore mismatch"), {
          endpoint: "/api/assessment/results",
          userId: user.id,
          operation: "rescoreMismatch",
        });
      }
    }

    await persistAssessmentOutcome(
      user.id,
      body.mode,
      serverResult,
      checkpointLevel,
    );
  } catch (error) {
    logServerError("Assessment result save failed", error, {
      endpoint: "/api/assessment/results",
      operation: "persistAssessmentOutcome",
      userId: user.id,
    });
    return publicErrorResponse(500, "Failed to save assessment result");
  }

  return NextResponse.json({ ok: true }, { headers: SECURE_HEADERS });
}
