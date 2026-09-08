import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  FOCUS_DRILL_SYSTEM_PROMPT,
  buildFocusDrillUserPrompt,
} from '@/lib/ai-prompts'
import { requireSameOrigin, requireUser, checkLayeredRateLimit, validateBody } from '@/lib/api/guards'
import { callGeminiJson, parseGeminiJson } from '@/lib/gemini/json-route'
import type { DrillBody } from '@/lib/focus/types'

const RequestSchema = z.object({
  gaps: z.array(z.object({
    kind: z.enum(['grammar', 'phoneme', 'vocabulary']),
    targetId: z.string().min(1).max(100),
    label: z.string().min(1).max(100),
    level: z.enum(['a1', 'a2', 'b1', 'b2', 'c1']),
  })).min(1).max(2),
  level: z.enum(['a1', 'a2', 'b1', 'b2', 'c1']),
}).strict()

const ResponseSchema = z.object({
  sentences: z.array(z.object({
    text: z.string().min(5).max(300),
    translation: z.string().min(5).max(300),
    gapWord: z.string().min(1).max(50),
  })).min(5).max(12),
}).strict()

export async function POST(request: NextRequest): Promise<NextResponse> {
  const originError = requireSameOrigin(request)
  if (originError) return originError

  const { user, error: authError } = await requireUser(request)
  if (authError) return authError as NextResponse

  const { limited, error: rateLimitError } = await checkLayeredRateLimit({
    request,
    user,
    endpoint: '/api/gemini/focus/generate-drill',
    maxPermanent: 20,
    maxAnonymous: 3,
  })
  if (limited) return rateLimitError as NextResponse

  const { data: body, error: validationError } = await validateBody(request, RequestSchema)
  if (validationError) return validationError as NextResponse

  const { data: result, response } = await callGeminiJson<DrillBody>({
    endpoint: '/api/gemini/focus/generate-drill',
    userId: user.id,
    params: {
      contents: buildFocusDrillUserPrompt({
        gaps: body.gaps,
        level: body.level,
      }),
      config: {
        systemInstruction: FOCUS_DRILL_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        temperature: 0.6,
        maxOutputTokens: 1024,
      },
    },
    parse: (raw) => parseGeminiJson(raw, (json) => ResponseSchema.parse(json)),
    failureMessage: 'Failed to generate focus drill',
  })

  if (response) return response
  return NextResponse.json(result)
}
