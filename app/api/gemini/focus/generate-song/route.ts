import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  FOCUS_SONG_SYSTEM_PROMPT,
  buildFocusSongUserPrompt,
} from '@/lib/ai-prompts'
import { requireSameOrigin, requireUser, checkLayeredRateLimit, validateBody } from '@/lib/api/guards'
import { callGeminiJson, parseGeminiJson } from '@/lib/gemini/json-route'
import type { SongBody } from '@/lib/focus/types'

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
  title: z.string().min(1).max(150),
  lyrics: z.string().min(20).max(1500),
  gapLines: z.array(z.number().int().min(0).max(20)).min(1),
  notes: z.string().min(5).max(400),
}).strict()

export async function POST(request: NextRequest): Promise<NextResponse> {
  const originError = requireSameOrigin(request)
  if (originError) return originError

  const { user, error: authError } = await requireUser(request)
  if (authError) return authError as NextResponse

  const { limited, error: rateLimitError } = await checkLayeredRateLimit({
    request,
    user,
    endpoint: '/api/gemini/focus/generate-song',
    maxPermanent: 20,
    maxAnonymous: 3,
  })
  if (limited) return rateLimitError as NextResponse

  const { data: body, error: validationError } = await validateBody(request, RequestSchema)
  if (validationError) return validationError as NextResponse

  const { data: result, response } = await callGeminiJson<SongBody>({
    endpoint: '/api/gemini/focus/generate-song',
    userId: user.id,
    params: {
      contents: buildFocusSongUserPrompt({
        gaps: body.gaps,
        level: body.level,
      }),
      config: {
        systemInstruction: FOCUS_SONG_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        temperature: 0.8,
        maxOutputTokens: 1024,
      },
    },
    parse: (raw) => parseGeminiJson(raw, (json) => ResponseSchema.parse(json)),
    failureMessage: 'Failed to generate focus song',
  })

  if (response) return response
  return NextResponse.json(result)
}
