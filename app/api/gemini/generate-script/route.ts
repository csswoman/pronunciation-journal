import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  requireSameOrigin,
  requireUser,
  checkLayeredRateLimit,
  validateBody,
  SECURE_HEADERS,
} from '@/lib/api/guards'
import { buildScriptGenerationPrompt } from '@/lib/ai-prompts'
import { emptyLearnerContext, type LearnerContext } from '@/lib/ai-coach/learner-context'
import { callGeminiJson, parseGeminiJson } from '@/lib/gemini/json-route'

export const runtime = 'nodejs'

const RequestSchema = z.object({
  topic: z.string().min(1).max(120),
  cefr: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
  srsDueWords: z.array(z.string()).max(10).optional(),
}).strict()

/** Forma que debe devolver el modelo. Exportado para poder testearlo solo. */
export const GeneratedScriptSchema = z.object({
  script: z.array(z.object({
    speaker: z.enum(['coach', 'learner']),
    text: z.string().min(1).max(300),
  })).min(2).max(12),
}).strict()

export async function POST(req: NextRequest): Promise<NextResponse> {
  const originError = requireSameOrigin(req)
  if (originError) return originError

  const { user, error: authError } = await requireUser(req)
  if (authError) return authError as NextResponse

  const { limited, error: rateLimitError } = await checkLayeredRateLimit({
    request: req,
    user,
    endpoint: '/api/gemini/generate-script',
    maxPermanent: 10,
    maxAnonymous: 2,
  })
  if (limited) return rateLimitError as NextResponse

  const { data: body, error: validationError } = await validateBody(req, RequestSchema)
  if (validationError) return validationError as NextResponse

  const context: LearnerContext = {
    ...emptyLearnerContext(),
    cefr: body.cefr,
    srsDueWords: body.srsDueWords ?? [],
  }

  const prompt = buildScriptGenerationPrompt({ topic: body.topic, context })

  const { data: result, response } = await callGeminiJson({
    endpoint: '/api/gemini/generate-script',
    userId: user.id,
    params: {
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
    },
    parse: (raw) => parseGeminiJson(raw, (json) => GeneratedScriptSchema.parse(json)),
    failureMessage: 'No se pudo generar el guión',
  })

  if (response) return response
  return NextResponse.json(result, { headers: SECURE_HEADERS })
}
