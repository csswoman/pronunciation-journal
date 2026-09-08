import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSameOrigin, requireUser, checkLayeredRateLimit, validateBody } from "@/lib/api/guards";
import { callGeminiJson, parseGeminiJson } from "@/lib/gemini/json-route";
import {
  TRACKING_ENRICH_SYSTEM_PROMPT,
  buildTrackingEnrichUserPrompt,
} from "@/lib/ai-prompts";

const trackingEnrichRequestSchema = z.object({
  text: z.string().min(1).max(300),
  context: z.string().max(500).optional().nullable(),
  kind: z.enum(["word", "phrase"]).optional().default("word"),
});

const trackingEnrichResponseSchema = z.object({
  ipa: z.string().default(""),
  translation: z.string().default(""),
  meaning: z.string().default(""),
  context: z.string().default(""),
  explanationEs: z.string().optional().default(""),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const { user, error: authError } = await requireUser(request);
  if (authError) return authError as NextResponse;

  const limited = await checkLayeredRateLimit({
    request,
    user,
    endpoint: "/api/gemini/tracking-enrich",
    maxPermanent: 25,
    maxAnonymous: 5,
  });
  if (limited.limited) return limited.error as NextResponse;

  const parsed = await validateBody(request, trackingEnrichRequestSchema);
  if (parsed.error) return parsed.error as NextResponse;

  const result = await callGeminiJson({
    endpoint: "/api/gemini/tracking-enrich",
    userId: user.id,
    params: {
      contents: buildTrackingEnrichUserPrompt(parsed.data),
      config: {
        systemInstruction: TRACKING_ENRICH_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        temperature: 0.2,
        maxOutputTokens: 800,
      },
    },
    parse: (raw) =>
      trackingEnrichResponseSchema.parse(
        parseGeminiJson(raw, (json) => json)
      ),
    failureMessage: "No se pudo enriquecer el concepto con IA",
  });

  if (result.response) return result.response;

  return NextResponse.json(result.data);
}
