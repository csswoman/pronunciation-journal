import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  GRADE_PRODUCTION_SYSTEM_PROMPT,
  buildGradeProductionUserPrompt,
} from "@/lib/ai-prompts";
import { requireSameOrigin, requireUser, rateLimit, validateBody, publicErrorResponse, redactError } from "@/lib/api/guards";
import { callWithFallback, getErrorStatus, stripJsonFences } from "@/lib/gemini/client";
import type { ProductionGradeResult } from "@/lib/exercises/production-grade";

const GradeProductionSchema = z.object({
  targetItem: z.string().min(1).max(100),
  targetMeaning: z.string().max(500).optional(),
  taskPrompt: z.string().min(1).max(500),
  production: z.string().min(1).max(2000),
  modality: z.enum(["written", "spoken"]),
}).strict();

const GradeResponseSchema = z.object({
  correct: z.boolean(),
  usedTarget: z.boolean(),
  grammaticallyCorrect: z.boolean(),
  feedback: z.string().max(2000),
  corrections: z.string().max(2000).optional(),
  score: z.number().min(0).max(100),
}).strict();

function parseGradeJson(raw: string): ProductionGradeResult {
  const parsed = GradeResponseSchema.parse(JSON.parse(stripJsonFences(raw)));
  return { ...parsed, score: Math.round(parsed.score) };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const { user, error: authError } = await requireUser(request);
  if (authError) return authError as NextResponse;

  const { limited, error: rateLimitError } = await rateLimit(`/api/gemini/grade-production:${user.id}`, {
    max: 30,
    windowMs: 60_000,
    meta: { endpoint: "/api/gemini/grade-production", userId: user.id },
  });
  if (limited) return rateLimitError as NextResponse;

  const { data: body, error: validationError } = await validateBody(request, GradeProductionSchema);
  if (validationError) return validationError as NextResponse;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "AI service unavailable" }, { status: 503 });

  try {
    const grade = await callWithFallback(
      apiKey,
      {
        contents: buildGradeProductionUserPrompt(body),
        config: {
          systemInstruction: GRADE_PRODUCTION_SYSTEM_PROMPT,
          responseMimeType: "application/json",
          temperature: 0.1,
          maxOutputTokens: 768,
        },
      },
      parseGradeJson
    );
    return NextResponse.json(grade);
  } catch (err: unknown) {
    console.error("grade-production error:", redactError(err));
    const status = getErrorStatus(err) ?? 500;
    return publicErrorResponse(status >= 500 ? 500 : status, "Failed to grade production");
  }
}
