import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSameOrigin, requireUser, checkLayeredRateLimit, validateBody } from "@/lib/api/guards";
import { callGeminiJson } from "@/lib/gemini/json-route";
import { MESSAGE_TRANSLATION_SYSTEM_PROMPT, buildMessageTranslationPrompt } from "@/lib/ai-prompts";

const RequestSchema = z.object({
  text: z.string().min(1).max(2000),
}).strict();

const ResponseSchema = z.object({
  translation: z.string(),
}).strict();

export async function POST(request: NextRequest): Promise<NextResponse> {
  const originError = requireSameOrigin(request);
  if (originError) return originError as NextResponse;

  const { user, error: authError } = await requireUser(request);
  if (authError) return authError as NextResponse;

  const { limited, error: rateLimitError } = await checkLayeredRateLimit({
    request,
    user,
    endpoint: "/api/gemini/translate",
    maxPermanent: 30,
    maxAnonymous: 5,
  });
  if (limited) return rateLimitError as NextResponse;

  const { data, error } = await validateBody(request, RequestSchema);
  if (error) return error as NextResponse;

  const result = await callGeminiJson({
    endpoint: "/api/gemini/translate",
    userId: user.id,
    params: {
      contents: buildMessageTranslationPrompt(data.text),
      config: {
        systemInstruction: MESSAGE_TRANSLATION_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        temperature: 0.2,
        maxOutputTokens: 500,
      },
    },
    parse: (raw) => {
      try {
        const json = JSON.parse(raw.replace(/^```json\s*|\s*```$/g, "").trim());
        return ResponseSchema.parse(json);
      } catch {
        return { translation: raw.trim() };
      }
    },
    failureMessage: "No se pudo obtener la traducción en este momento",
  });

  if (result.response) return result.response;
  return NextResponse.json(result.data);
}
