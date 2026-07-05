import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  GENERATE_READER_SYSTEM_PROMPT,
  buildGenerateReaderUserPrompt,
} from "@/lib/ai-prompts";
import { requireSameOrigin, requireUser, rateLimit, validateBody, publicErrorResponse, redactError } from "@/lib/api/guards";
import { callWithFallback, getErrorStatus, stripJsonFences, shouldTryNextModel as defaultShouldRetry } from "@/lib/gemini/client";
import { passageEmbedsTargets } from "@/lib/practice/reader/refinement";
import type { ReaderQuestion } from "@/lib/practice/reader/types";

const RequestSchema = z.object({
  targets: z.array(z.string().min(1).max(40)).min(1).max(10),
  level: z.string().min(2).max(4),
}).strict();

const ResponseSchema = z.object({
  passage: z.string().min(1).max(2000),
  topic: z.string().max(200),
  questions: z.array(z.object({
    prompt: z.string().min(1).max(500),
    options: z.array(z.string().min(1).max(200)).length(4),
    correctIndex: z.number().int().min(0).max(3),
  })).min(1).max(2),
}).strict();

interface ReaderResult { passage: string; topic: string; questions: ReaderQuestion[] }

function makeReaderParser(targets: string[]) {
  return function parseReader(raw: string): ReaderResult {
    const parsed = ResponseSchema.parse(JSON.parse(stripJsonFences(raw)));
    if (!passageEmbedsTargets(parsed.passage, targets)) {
      throw Object.assign(new Error("refinement failed"), { statusCode: 422 });
    }
    return parsed;
  };
}

function readerShouldRetry(err: unknown): boolean {
  return (
    String((err as { message?: unknown })?.message ?? "").includes("refinement") ||
    defaultShouldRetry(err)
  );
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const { user, error: authError } = await requireUser(request);
  if (authError) return authError as NextResponse;

  const { limited, error: rateLimitError } = await rateLimit(`/api/gemini/generate-reader:${user.id}`, {
    max: 20,
    windowMs: 60_000,
    meta: { endpoint: "/api/gemini/generate-reader", userId: user.id },
  });
  if (limited) return rateLimitError as NextResponse;

  const { data: body, error: validationError } = await validateBody(request, RequestSchema);
  if (validationError) return validationError as NextResponse;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "AI service unavailable" }, { status: 503 });

  try {
    const result = await callWithFallback(
      apiKey,
      {
        contents: buildGenerateReaderUserPrompt({ targets: body.targets, level: body.level }),
        config: {
          systemInstruction: GENERATE_READER_SYSTEM_PROMPT,
          responseMimeType: "application/json",
          temperature: 0.6,
          maxOutputTokens: 1024,
        },
      },
      makeReaderParser(body.targets),
      { shouldRetry: readerShouldRetry }
    );
    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error("generate-reader error:", redactError(err));
    const status = getErrorStatus(err) ?? 500;
    return publicErrorResponse(status >= 500 ? 500 : status, "Failed to generate reader");
  }
}
