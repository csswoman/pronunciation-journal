import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSameOrigin, requireUser, rateLimit, validateBody, SECURE_HEADERS, publicErrorResponse } from "@/lib/api/guards";
import { persistAssessmentOutcome } from "@/lib/courses/assessment-queries";
import { logServerError } from "@/lib/api/logging";
import type { AssessmentResult } from "@/lib/courses/assessment";
import type { CefrLevelId } from "@/lib/courses/types";

export const runtime = "nodejs";

const AssessmentResultSchema = z.object({
  mode: z.enum(["placement", "checkpoint"]),
  evaluatedLevel: z.enum(["a1", "a2", "b1", "b2", "c1"] satisfies [CefrLevelId, ...CefrLevelId[]]).nullable().optional(),
  result: z.object({
    assignedLevel: z.enum(["A1", "A2", "B1", "B2", "C1"]),
    passed: z.boolean(),
    passedLevels: z.array(z.enum(["a1", "a2", "b1", "b2", "c1"] satisfies [CefrLevelId, ...CefrLevelId[]])).max(5),
    score: z.number().int().min(0),
    total: z.number().int().min(1).max(500),
    topicScores: z.array(z.object({
      lessonSlug: z.string().min(1).max(200),
      title: z.string().min(1).max(200),
      correct: z.number().int().min(0),
      total: z.number().int().min(1).max(100),
    }).strict()).max(100),
    strengths: z.array(z.object({
      lessonSlug: z.string().min(1).max(200),
      title: z.string().min(1).max(200),
    }).strict()).max(100),
    needsReview: z.array(z.object({
      lessonSlug: z.string().min(1).max(200),
      title: z.string().min(1).max(200),
    }).strict()).max(100),
  }).strict(),
}).strict();

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
