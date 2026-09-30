import { NextRequest, NextResponse } from "next/server";
import {
  hashIp,
  getClientIp,
  rateLimit,
  requireSameOrigin,
  SECURE_HEADERS,
  validateBody,
  publicErrorResponse,
} from "@/lib/api/guards";
import { AssessmentScoreRequestSchema } from "@/lib/courses/assessment-schema";
import { scoreAssessment } from "@/lib/courses/assessment";
import { buildServerAssessment } from "@/lib/courses/server-assessment";

export const runtime = "nodejs";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const originError = requireSameOrigin(req);
  if (originError) return originError;

  const ipHash = hashIp(getClientIp(req));
  const { limited, error: rateLimitError } = await rateLimit(`/api/assessment/score:${ipHash}`, {
    max: 30,
    windowMs: 60_000,
    meta: { endpoint: "/api/assessment/score" },
  });
  if (limited) return rateLimitError;

  const { data: body, error: validationError } = await validateBody(req, AssessmentScoreRequestSchema);
  if (validationError) return validationError;

  try {
    const { questions, concepts } = buildServerAssessment(
      body.mode,
      body.checkpointLevel,
      body.evaluatedLevels,
    );
    if (questions.length === 0) return publicErrorResponse(400, "No assessment questions found");

    const result = scoreAssessment(
      questions,
      body.answers,
      body.mode,
      body.checkpointLevel,
      concepts,
      body.selfRatings ?? {},
    );
    return NextResponse.json({ result }, { headers: SECURE_HEADERS });
  } catch {
    return publicErrorResponse(500, "Failed to score assessment");
  }
}
