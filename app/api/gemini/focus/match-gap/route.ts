import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  FOCUS_GAP_MATCH_SYSTEM_PROMPT,
  buildFocusGapMatchUserPrompt,
} from '@/lib/ai-prompts'
import { requireSameOrigin, requireUser, checkLayeredRateLimit, validateBody } from '@/lib/api/guards'
import { callGeminiJson, parseGeminiJson } from '@/lib/gemini/json-route'
import { TOPIC_CATALOG, TOPIC_IDS } from '@/lib/topic-catalog'

const RequestSchema = z.object({
  description: z.string().min(3).max(300),
}).strict()

const ResponseSchema = z.object({
  matches: z.array(z.object({
    topicId: z.string().min(1).max(100),
    confidence: z.number().min(0).max(1),
    rationale: z.string().min(1).max(300),
  })).max(3),
  clarification: z.string().max(300).nullable().optional(),
}).strict()

export type FocusGapMatchResponse = z.infer<typeof ResponseSchema>

export async function POST(request: NextRequest): Promise<NextResponse> {
  const originError = requireSameOrigin(request)
  if (originError) return originError

  const { user, error: authError } = await requireUser(request)
  if (authError) return authError as NextResponse

  const { limited, error: rateLimitError } = await checkLayeredRateLimit({
    request,
    user,
    endpoint: '/api/gemini/focus/match-gap',
    maxPermanent: 30,
    maxAnonymous: 5,
  })
  if (limited) return rateLimitError as NextResponse

  const { data: body, error: validationError } = await validateBody(request, RequestSchema)
  if (validationError) return validationError as NextResponse

  const { data: result, response } = await callGeminiJson<FocusGapMatchResponse>({
    endpoint: '/api/gemini/focus/match-gap',
    userId: user.id,
    params: {
      contents: buildFocusGapMatchUserPrompt({
        description: body.description,
        catalog: TOPIC_CATALOG.map((t) => ({ id: t.id, label: t.label })),
      }),
      config: {
        systemInstruction: FOCUS_GAP_MATCH_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        temperature: 0.2,
        maxOutputTokens: 512,
      },
    },
    parse: (raw) => parseGeminiJson(raw, (json) => ResponseSchema.parse(json)),
    failureMessage: 'Failed to match focus gap',
  })

  if (response) return response

  // El modelo puede devolver un id plausible que no existe. Filtrar aquí evita
  // que un tema inventado llegue a createSprint y genere contenido sin anclaje.
  const matches = (result?.matches ?? []).filter((m) => TOPIC_IDS.has(m.topicId))

  return NextResponse.json({
    matches,
    clarification: matches.length === 0
      ? (result?.clarification ?? 'No encontré un tema del catálogo que encaje. Intenta describirlo con un ejemplo concreto.')
      : null,
  })
}
