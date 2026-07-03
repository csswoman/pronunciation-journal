import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSameOrigin, requireUser, rateLimit, validateBody, publicErrorResponse, redactError } from "@/lib/api/guards";
import { callWithFallback, getErrorStatus, stripJsonFences } from "@/lib/gemini/client";
import { INTERVIEW_SYSTEM_PROMPT, buildInterviewPrompt } from "@/lib/ai-prompts";

const InterviewSchema = z.object({
  scenario: z.enum(["hr", "frontend", "system-design", "behavioral", "product", "ai-developer"]),
  level: z.enum(["beginner", "intermediate", "advanced"]),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const { user, error: authError } = await requireUser();
  if (authError) return authError as NextResponse;

  const { limited, error: rateLimitError } = await rateLimit(`/api/gemini/interview:${user.id}`, {
    max: 10,
    windowMs: 60_000,
    meta: { endpoint: "/api/gemini/interview", userId: user.id },
  });
  if (limited) return rateLimitError as NextResponse;

  const { data: body, error: validationError } = await validateBody(request, InterviewSchema);
  if (validationError) return validationError as NextResponse;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "AI service unavailable" }, { status: 503 });

  const prompt = buildInterviewPrompt(body.scenario, body.level);

  try {
    const parsed = await callWithFallback(
      apiKey,
      {
        contents: prompt,
        config: { systemInstruction: INTERVIEW_SYSTEM_PROMPT, responseMimeType: "application/json" },
      },
      (text) => JSON.parse(stripJsonFences(text))
    );
    return NextResponse.json(parsed);
  } catch (err: unknown) {
    console.error("interview error:", redactError(err));
    const status = getErrorStatus(err) ?? 500;
    return publicErrorResponse(status >= 500 ? 500 : status, "Failed to generate interview");
  }
}
