import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  GRADE_PRODUCTION_SYSTEM_PROMPT,
  buildGradeProductionUserPrompt,
} from "@/lib/ai-prompts";
import { requireSameOrigin, requireUser, checkLayeredRateLimit, validateBody } from "@/lib/api/guards";
import { parseGeminiJson, respondWithGeminiJson } from "@/lib/gemini/json-route";
import { QUALITY_FALLBACK_MODELS } from "@/lib/gemini/fallback";
import type { ProductionGradeResult } from "@/lib/exercises/production-grade";
import { productionGradeResponseSchema } from "@/lib/exercises/production-grade-schema";
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

function parseGradeJson(raw: string): ProductionGradeResult {
  const parsed = parseGeminiJson(raw, (json) => productionGradeResponseSchema.parse(json));
  const constraintMet = parsed.constraintMet ?? true;
  // The model can contradict its own rubric (observed in the A1 article case).
  // The three criterion flags are the authoritative inputs to the final pass.
  const correct = parsed.usedTarget && parsed.grammaticallyCorrect && constraintMet;
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
    schema: productionGradeResponseSchema,
    parse: parseGradeJson,
    fallbackOptions: { models: QUALITY_FALLBACK_MODELS },
    failureMessage: "Failed to grade production",
  });
}
