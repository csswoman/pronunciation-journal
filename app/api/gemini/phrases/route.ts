import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSameOrigin, requireUser, checkLayeredRateLimit, validateBody, SECURE_HEADERS } from "@/lib/api/guards";
import { parseGeminiJson, respondWithGeminiJson } from "@/lib/gemini/json-route";
import { buildPhrasesUserPrompt, PRONUNCIATION_PHRASES_SYSTEM_PROMPT } from "@/lib/ai-prompts";

const PhrasesSchema = z.object({
  exclude: z.array(z.string().max(200)).max(100).optional(),
}).strict();

const PhrasesResponseSchema = z.object({
  phrases: z.array(z.string().trim().min(1).max(200)).min(1).max(20),
}).strict();

function parsePhrases(raw: string): { phrases: string[] } {
  return parseGeminiJson(raw, (json) => PhrasesResponseSchema.parse(json));
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const { user, error: authError } = await requireUser(request);
  if (authError) return authError as NextResponse;

  const { limited, error: rateLimitError } = await checkLayeredRateLimit({
    request,
    user,
    endpoint: "/api/gemini/phrases",
    maxPermanent: 10,
    maxAnonymous: 3,
  });
  if (limited) return rateLimitError as NextResponse;

  const { data: body, error: validationError } = await validateBody(request, PhrasesSchema);
  if (validationError) return validationError as NextResponse;

  const prompt = buildPhrasesUserPrompt(body?.exclude);

  return respondWithGeminiJson({
    endpoint: "/api/gemini/phrases",
    userId: user.id,
    params: {
      contents: prompt,
      config: { systemInstruction: PRONUNCIATION_PHRASES_SYSTEM_PROMPT, responseMimeType: "application/json" },
    },
    parse: parsePhrases,
    failureMessage: "Failed to generate phrases",
    headers: SECURE_HEADERS,
  });
}
