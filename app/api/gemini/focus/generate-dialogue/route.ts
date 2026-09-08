import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  FOCUS_DIALOGUE_SYSTEM_PROMPT,
  buildFocusDialogueUserPrompt,
} from '@/lib/ai-prompts'
import { requireSameOrigin, requireUser, checkLayeredRateLimit, validateBody } from '@/lib/api/guards'
import { callGeminiJson, parseGeminiJson } from '@/lib/gemini/json-route'
import type { DialogueBody } from '@/lib/focus/types'

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
  context: z.string().min(5).max(300),
  turns: z.array(z.object({
    speaker: z.enum(['A', 'B']),
    text: z.string().min(2).max(400),
  })).min(6).max(16),
}).strict()

export async function POST(request: NextRequest): Promise<NextResponse> {
  const originError = requireSameOrigin(request)
  if (originError) return originError

  const { user, error: authError } = await requireUser(request)
  if (authError) return authError as NextResponse

  const { limited, error: rateLimitError } = await checkLayeredRateLimit({
    request,
    user,
    endpoint: '/api/gemini/focus/generate-dialogue',
    maxPermanent: 20,
    maxAnonymous: 3,
  })
  if (limited) return rateLimitError as NextResponse

  const { data: body, error: validationError } = await validateBody(request, RequestSchema)
  if (validationError) return validationError as NextResponse

  const { data: result, response } = await callGeminiJson<DialogueBody>({
    endpoint: '/api/gemini/focus/generate-dialogue',
    userId: user.id,
    params: {
      contents: buildFocusDialogueUserPrompt({
        gaps: body.gaps,
        level: body.level,
      }),
      config: {
        systemInstruction: FOCUS_DIALOGUE_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
    },
    parse: (raw) => parseGeminiJson(raw, (json) => ResponseSchema.parse(json)),
    failureMessage: 'Failed to generate focus dialogue',
  })

  if (response) return response
  return NextResponse.json(result)
}
