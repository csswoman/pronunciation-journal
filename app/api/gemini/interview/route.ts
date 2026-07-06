import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSameOrigin, requireUser, rateLimit, validateBody } from "@/lib/api/guards";
import { parseGeminiJson, respondWithGeminiJson } from "@/lib/gemini/json-route";
import { INTERVIEW_SYSTEM_PROMPT, buildInterviewPrompt } from "@/lib/ai-prompts";

const InterviewSchema = z.object({
  scenario: z.enum(["hr", "frontend", "system-design", "behavioral", "product", "ai-developer"]),
  level: z.enum(["beginner", "intermediate", "advanced"]),
});

const InterviewResponseSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  turns: z.array(z.object({
    role: z.enum(["interviewer", "candidate"]),
    text: z.string().min(1).max(2000),
  }).strict()).min(2).max(24),
}).passthrough();

export async function POST(request: NextRequest): Promise<NextResponse> {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const { user, error: authError } = await requireUser(request);
  if (authError) return authError as NextResponse;

  const { limited, error: rateLimitError } = await rateLimit(`/api/gemini/interview:${user.id}`, {
    max: 10,
    windowMs: 60_000,
    meta: { endpoint: "/api/gemini/interview", userId: user.id },
  });
  if (limited) return rateLimitError as NextResponse;

  const { data: body, error: validationError } = await validateBody(request, InterviewSchema);
  if (validationError) return validationError as NextResponse;

  const prompt = buildInterviewPrompt(body.scenario, body.level);

  return respondWithGeminiJson({
    endpoint: "/api/gemini/interview",
    userId: user.id,
    params: {
      contents: prompt,
      config: { systemInstruction: INTERVIEW_SYSTEM_PROMPT, responseMimeType: "application/json" },
    },
    parse: (text) => parseGeminiJson(text, (json) => InterviewResponseSchema.parse(json)),
    failureMessage: "Failed to generate interview",
  });
}
