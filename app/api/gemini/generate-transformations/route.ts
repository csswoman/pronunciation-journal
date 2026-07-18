import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { GENERATE_TRANSFORMATIONS_SYSTEM_PROMPT, buildGenerateTransformationsPrompt } from '@/lib/ai-prompts'
import { requireSameOrigin, requireUser, rateLimit, validateBody } from '@/lib/api/guards'
import { parseGeminiJson, respondWithGeminiJson } from '@/lib/gemini/json-route'

const RequestSchema = z.object({ topic: z.string().trim().min(2).max(120), level: z.string().min(2).max(4), count: z.number().int().min(1).max(5).default(3) }).strict()
const ResponseSchema = z.object({ exercises: z.array(z.object({ sourceSentence: z.string().min(4).max(300), instruction: z.string().min(3).max(300), referenceAnswer: z.string().min(4).max(300) }).strict()).min(1).max(5) }).strict()

export async function POST(request: NextRequest): Promise<NextResponse> {
  const originError = requireSameOrigin(request)
  if (originError) return originError
  const { user, error: authError } = await requireUser(request)
  if (authError) return authError as NextResponse
  const { limited, error: rateLimitError } = await rateLimit(`/api/gemini/generate-transformations:${user.id}`, { max: 10, windowMs: 60_000, meta: { endpoint: '/api/gemini/generate-transformations', userId: user.id } })
  if (limited) return rateLimitError as NextResponse
  const { data, error } = await validateBody(request, RequestSchema)
  if (error) return error as NextResponse
  return respondWithGeminiJson({ endpoint: '/api/gemini/generate-transformations', userId: user.id, params: { contents: buildGenerateTransformationsPrompt(data), config: { systemInstruction: GENERATE_TRANSFORMATIONS_SYSTEM_PROMPT, responseMimeType: 'application/json', temperature: 0.4, maxOutputTokens: 1024 } }, parse: (raw) => parseGeminiJson(raw, (json) => ResponseSchema.parse(json)), failureMessage: 'Failed to generate transformations' })
}
