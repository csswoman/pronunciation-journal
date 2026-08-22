import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireSameOrigin, requireUser, checkLayeredRateLimit, validateBody } from '@/lib/api/guards'
import { callGeminiJson, parseGeminiJson } from '@/lib/gemini/json-route'
import { buildWordSearchUserPrompt, WORD_SEARCH_SYSTEM_PROMPT } from '@/lib/ai-prompts'

const WordSearchRequestSchema = z.object({
  topic: z.string().min(1).max(150),
  level: z.enum(['beginner', 'intermediate', 'advanced']).optional().default('intermediate'),
  count: z.number().int().min(4).max(8).optional().default(6),
  knownWords: z.array(z.string().max(50)).max(30).optional(),
})

const WordSearchItemSchema = z.object({
  word: z.string().min(2).max(12),
  ipa: z.string().min(1).max(30).optional(),
  clue: z.string().min(5).max(300),
  meaningEs: z.string().min(1).max(150),
  exampleSentence: z.string().min(5).max(250),
})

const WordSearchResponseSchema = z.object({
  topicTitle: z.string(),
  words: z.array(WordSearchItemSchema).min(3).max(10),
})

export async function POST(request: NextRequest): Promise<NextResponse> {
  const originError = requireSameOrigin(request)
  if (originError) return originError

  const { user, error: authError } = await requireUser(request)
  if (authError) return authError as NextResponse

  const { limited, error: rateLimitError } = await checkLayeredRateLimit({
    request,
    user,
    endpoint: '/api/gemini/word-search',
    maxPermanent: 12,
    maxAnonymous: 3,
  })
  if (limited) return rateLimitError as NextResponse

  const { data: body, error: validationError } = await validateBody(
    request,
    WordSearchRequestSchema
  )
  if (validationError) return validationError as NextResponse

  const { data: parsed, response } = await callGeminiJson({
    endpoint: '/api/gemini/word-search',
    userId: user.id,
    params: {
      contents: buildWordSearchUserPrompt(body),
      config: {
        systemInstruction: WORD_SEARCH_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
      },
    },
    parse: (text) => parseGeminiJson(text, (json) => WordSearchResponseSchema.parse(json)),
    failureMessage: 'No se pudo generar la búsqueda de palabras con IA',
  })

  if (response) return response

  return NextResponse.json(parsed)
}
