import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  GRADE_PRODUCTION_SYSTEM_PROMPT,
  buildGradeProductionUserPrompt,
} from "@/lib/ai-prompts";
import { requireSameOrigin, requireUser, checkLayeredRateLimit, validateBody } from "@/lib/api/guards";
import { parseGeminiJson, respondWithGeminiJson } from "@/lib/gemini/json-route";
import type { ProductionGradeResult } from "@/lib/exercises/production-grade";
import { isErrorPatternId } from "@/lib/exercises/error-patterns";

const GradeProductionSchema = z.object({
  targetItem: z.string().min(1).max(100),
  targetMeaning: z.string().max(500).optional(),
  taskPrompt: z.string().min(1).max(500),
  production: z.string().min(1).max(2000),
  modality: z.enum(["written", "spoken"]),
  level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]).optional(),
  constraintCheck: z.string().max(400).optional(),
}).strict();

const GradeResponseSchema = z.object({
  correct: z.boolean(),
  usedTarget: z.boolean(),
  grammaticallyCorrect: z.boolean(),
  constraintMet: z.boolean().optional(),
  feedback: z.string().max(2000),
  corrections: z.string().max(2000).optional(),
  errorPattern: z.string().max(64).optional(),
  score: z.number().min(0).max(100),
}).strict();

function parseGradeJson(raw: string): ProductionGradeResult {
  const parsed = parseGeminiJson(raw, (json) => GradeResponseSchema.parse(json));
  const constraintMet = parsed.constraintMet ?? true;
  const correct = parsed.correct && constraintMet;
  return {
    ...parsed,
    constraintMet,
    correct,
    // Discard hallucinated labels rather than letting them pollute the
    // learner's recurrence queue. Also drop it entirely when the answer
    // was correct — there is no error to schedule.
    errorPattern:
      !correct && isErrorPatternId(parsed.errorPattern) ? parsed.errorPattern : undefined,
    score: Math.round(parsed.score),
  };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const { user, error: authError } = await requireUser(request);
  if (authError) return authError as NextResponse;

  const { limited, error: rateLimitError } = await checkLayeredRateLimit({
    request,
    user,
    endpoint: "/api/gemini/grade-production",
    // Free spoken/written production is the highest-volume graded exercise:
    // a session now runs a dozen items rather than one. Raised for a
    // single-owner deployment so a fast session never hits a 429 mid-flow.
    // maxAnonymous stays low on purpose — guests must not be able to burn
    // the Gemini quota. Window is 60s (see lib/api/rate-limit.ts).
    maxPermanent: 120,
    maxAnonymous: 3,
  });
  if (limited) return rateLimitError as NextResponse;

  const { data: body, error: validationError } = await validateBody(request, GradeProductionSchema);
  if (validationError) return validationError as NextResponse;

  return respondWithGeminiJson({
    endpoint: "/api/gemini/grade-production",
    userId: user.id,
    params: {
      contents: buildGradeProductionUserPrompt(body),
      config: {
        systemInstruction: GRADE_PRODUCTION_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        temperature: 0.1,
        maxOutputTokens: 768,
      },
    },
    parse: parseGradeJson,
    failureMessage: "Failed to grade production",
  });
}
