import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  FOCUS_STORY_SYSTEM_PROMPT,
  buildFocusStoryUserPrompt,
} from '@/lib/ai-prompts'
import { requireSameOrigin, requireUser, checkLayeredRateLimit, validateBody } from '@/lib/api/guards'
import { callGeminiJson, parseGeminiJson } from '@/lib/gemini/json-route'
import { getUserInterests } from '@/lib/users/server-queries'
import { logServerError } from '@/lib/api/logging'
import type { StoryBody } from '@/lib/focus/types'

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
  passage: z.string().min(50).max(2500),
  explanation: z.string().min(10).max(500),
  keyPhrases: z.array(z.string().min(1).max(100)).min(1).max(10),
}).strict()

export async function POST(request: NextRequest): Promise<NextResponse> {
  const originError = requireSameOrigin(request)
  if (originError) return originError

  const { user, error: authError } = await requireUser(request)
  if (authError) return authError as NextResponse

  const { limited, error: rateLimitError } = await checkLayeredRateLimit({
    request,
    user,
    endpoint: '/api/gemini/focus/generate-story',
    maxPermanent: 20,
    maxAnonymous: 3,
  })
  if (limited) return rateLimitError as NextResponse

  const { data: body, error: validationError } = await validateBody(request, RequestSchema)
  if (validationError) return validationError as NextResponse

  let interests: string[] = []
  try {
    interests = await getUserInterests(user.id)
  } catch (err: unknown) {
    logServerError('Focus story interests lookup failed', err, {
      endpoint: '/api/gemini/focus/generate-story',
      operation: 'getUserInterests',
      userId: user.id,
    }, 'warn')
  }

  const { data: result, response } = await callGeminiJson<StoryBody>({
    endpoint: '/api/gemini/focus/generate-story',
    userId: user.id,
    params: {
      contents: buildFocusStoryUserPrompt({
        gaps: body.gaps,
        level: body.level,
        interests,
      }),
      config: {
        systemInstruction: FOCUS_STORY_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
    },
    parse: (raw) => parseGeminiJson(raw, (json) => ResponseSchema.parse(json)),
    failureMessage: 'Failed to generate focus story',
  })

  if (response) return response
  return NextResponse.json(result)
}
