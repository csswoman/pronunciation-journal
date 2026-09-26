import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { GENERATE_TRANSLATIONS_SYSTEM_PROMPT, buildGenerateTranslationsPrompt } from '@/lib/ai-prompts'
import { requireSameOrigin, requireUser, checkLayeredRateLimit, validateBody } from '@/lib/api/guards'
import { parseGeminiJson, respondWithGeminiJson } from '@/lib/gemini/json-route'

const RequestSchema = z.object({ topic: z.string().trim().min(2).max(120), level: z.string().min(2).max(4), count: z.number().int().min(1).max(5).default(2) }).strict()

/**
 * Every item ships its own answer key: 3–5 accepted answers let the client
 * grade most attempts without a request (Plan 037 C3). The schema travels to
 * Gemini as `responseJsonSchema`, so the bounds are enforced while decoding.
 */
export const GenerateTranslationsResponseSchema = z.object({
    exercises: z.array(z.object({
        sourceEs: z.string().min(2).max(300),
        referenceEn: z.string().min(2).max(300),
        acceptedAnswers: z.array(z.string().min(2).max(300)).min(3).max(5),
    }).strict()).min(1).max(5),
}).strict()

export async function POST(request: NextRequest): Promise<NextResponse> {
    const originError = requireSameOrigin(request)
    if (originError) return originError
    const { user, error: authError } = await requireUser(request)
    if (authError) return authError as NextResponse
    const { limited, error: rateLimitError } = await checkLayeredRateLimit({ request, user, endpoint: '/api/gemini/generate-translations', maxPermanent: 10, maxAnonymous: 3 })
    if (limited) return rateLimitError as NextResponse
    const { data, error } = await validateBody(request, RequestSchema)
    if (error) return error as NextResponse
    return respondWithGeminiJson({
        endpoint: '/api/gemini/generate-translations',
        userId: user.id,
        params: { contents: buildGenerateTranslationsPrompt(data), config: { systemInstruction: GENERATE_TRANSLATIONS_SYSTEM_PROMPT, responseMimeType: 'application/json', temperature: 0.4, maxOutputTokens: 1024 } },
        schema: GenerateTranslationsResponseSchema,
        parse: (raw) => parseGeminiJson(raw, (json) => GenerateTranslationsResponseSchema.parse(json)),
        failureMessage: 'Failed to generate translations',
    })
}
