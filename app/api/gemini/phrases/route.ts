import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSameOrigin, requireUser, rateLimit, validateBody, SECURE_HEADERS, publicErrorResponse, redactError } from "@/lib/api/guards";
import { callWithFallback, getErrorStatus, stripJsonFences } from "@/lib/gemini/client";
import { buildPhrasesUserPrompt, PRONUNCIATION_PHRASES_SYSTEM_PROMPT } from "@/lib/ai-prompts";

const PhrasesSchema = z.object({
  exclude: z.array(z.string().max(200)).max(100).optional(),
}).strict();

function parsePhrases(raw: string): { phrases: string[] } {
  const parsed = JSON.parse(stripJsonFences(raw)) as { phrases?: unknown };
  if (!Array.isArray(parsed.phrases)) throw new Error("Invalid response shape");
  return { phrases: parsed.phrases as string[] };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const { user, error: authError } = await requireUser(request);
  if (authError) return authError as NextResponse;

  const { limited, error: rateLimitError } = await rateLimit(`/api/gemini/phrases:${user.id}`, {
    max: 10,
    windowMs: 60_000,
    meta: { endpoint: "/api/gemini/phrases", userId: user.id },
  });
  if (limited) return rateLimitError as NextResponse;

  const { data: body, error: validationError } = await validateBody(request, PhrasesSchema);
  if (validationError) return validationError as NextResponse;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "AI service unavailable" }, { status: 503, headers: SECURE_HEADERS });

  const prompt = buildPhrasesUserPrompt(body?.exclude);

  try {
    const result = await callWithFallback(
      apiKey,
      {
        contents: prompt,
        config: { systemInstruction: PRONUNCIATION_PHRASES_SYSTEM_PROMPT, responseMimeType: "application/json" },
      },
      parsePhrases
    );
    return NextResponse.json(result, { headers: SECURE_HEADERS });
  } catch (err: unknown) {
    console.error("phrases error:", redactError(err));
    const status = getErrorStatus(err) ?? 500;
    return publicErrorResponse(status >= 500 ? 500 : status, "Failed to generate phrases");
  }
}
