import { NextRequest, NextResponse } from "next/server";
import { requireSameOrigin, requireUser, rateLimit, validateBody, SECURE_HEADERS, publicErrorResponse } from "@/lib/api/guards";
import { persistAssessmentOutcome } from "@/lib/courses/assessment-queries";
import { AssessmentResultSchema } from "@/lib/courses/assessment-schema";
import { logServerError } from "@/lib/api/logging";
import type { AssessmentResult } from "@/lib/courses/assessment";

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

  try {
    // Persists both the assessment_results row and the user's cefr_level on
    // user_profiles, so placement/checkpoint results actually set the level.
    await persistAssessmentOutcome(
      user.id,
      body.mode,
      body.result as AssessmentResult,
      body.evaluatedLevel ?? undefined,
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
