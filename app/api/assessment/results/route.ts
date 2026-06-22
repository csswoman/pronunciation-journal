import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSameOrigin, requireUser, SECURE_HEADERS } from "@/lib/api/guards";
import { saveAssessmentResult } from "@/lib/courses/assessment-queries";
import type { AssessmentResult } from "@/lib/courses/assessment";
import type { CefrLevelId } from "@/lib/courses/types";

export const runtime = "nodejs";

const AssessmentResultSchema = z.object({
  mode: z.enum(["placement", "checkpoint"]),
  evaluatedLevel: z.custom<CefrLevelId | null>().nullable().optional(),
  result: z.object({
    assignedLevel: z.string(),
    passed: z.boolean(),
    passedLevels: z.array(z.string()),
    score: z.number(),
    total: z.number(),
    topicScores: z.array(z.object({
      lessonSlug: z.string(),
      title: z.string(),
      correct: z.number(),
      total: z.number(),
    })),
  }).strict(),
}).strict();

export async function POST(req: NextRequest): Promise<NextResponse> {
  const originError = requireSameOrigin(req);
  if (originError) return originError;

  const { user, error: authError } = await requireUser(req);
  if (authError) return authError;

  const body = AssessmentResultSchema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json(
      { error: "Invalid assessment payload" },
      { status: 400, headers: SECURE_HEADERS },
    );
  }

  await saveAssessmentResult(
    user.id,
    body.data.mode,
    body.data.result as AssessmentResult,
    body.data.evaluatedLevel ?? undefined,
  );

  return NextResponse.json({ ok: true }, { headers: SECURE_HEADERS });
}
