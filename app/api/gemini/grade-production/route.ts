import { GoogleGenAI } from '@google/genai'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  GRADE_PRODUCTION_SYSTEM_PROMPT,
  buildGradeProductionUserPrompt,
} from '@/lib/ai-prompts'
import { requireSameOrigin, requireUser, rateLimit, validateBody } from '@/lib/api/guards'
import type { ProductionGradeResult } from '@/lib/exercises/production-grade'

const GradeProductionSchema = z.object({
  targetItem: z.string().min(1).max(100),
  targetMeaning: z.string().max(500).optional(),
  taskPrompt: z.string().min(1).max(500),
  production: z.string().min(1).max(2000),
  modality: z.enum(['written', 'spoken']),
}).strict()

const GradeResponseSchema = z.object({
  correct: z.boolean(),
  usedTarget: z.boolean(),
  grammaticallyCorrect: z.boolean(),
  feedback: z.string().max(2000),
  corrections: z.string().max(2000).optional(),
  score: z.number().min(0).max(100),
}).strict()

const ENABLE_PREVIEW_MODELS = process.env.GEMINI_ENABLE_PREVIEW_MODELS === 'true'
const BASE_MODELS = ['gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-flash-latest'] as const
const PREVIEW_MODELS = ['gemini-3.1-flash-lite-preview'] as const
const FALLBACK_MODELS = ENABLE_PREVIEW_MODELS ? [...BASE_MODELS, ...PREVIEW_MODELS] : [...BASE_MODELS]

function getErrorStatus(err: unknown): number | undefined {
  if (!err || typeof err !== 'object') return undefined
  const maybe = err as { status?: unknown; statusCode?: unknown }
  if (typeof maybe.status === 'number') return maybe.status
  if (typeof maybe.statusCode === 'number') return maybe.statusCode
  return undefined
}

function shouldTryNextModel(err: unknown): boolean {
  const status = getErrorStatus(err)
  if (status === 400 || status === 401 || status === 403) return false
  if (status === 404 || status === 408 || status === 429) return true
  if (typeof status === 'number' && status >= 500) return true
  const msg = String((err as { message?: unknown })?.message ?? '').toLowerCase()
  return msg.includes('quota') || msg.includes('rate') || msg.includes('unavailable') || msg.includes('timeout')
}

function parseGradeJson(raw: string): ProductionGradeResult {
  const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  const parsed = GradeResponseSchema.parse(JSON.parse(cleaned))
  return {
    ...parsed,
    score: Math.round(parsed.score),
  }
}

async function gradeWithFallback(ai: GoogleGenAI, prompt: string): Promise<ProductionGradeResult> {
  let lastError: unknown
  for (const modelName of FALLBACK_MODELS) {
    try {
      const result = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          systemInstruction: GRADE_PRODUCTION_SYSTEM_PROMPT,
          responseMimeType: 'application/json',
          temperature: 0.1,
          maxOutputTokens: 768,
        },
      })
      if (!result.text) throw new Error('Empty response from AI')
      return parseGradeJson(result.text)
    } catch (err: unknown) {
      lastError = err
      if (!shouldTryNextModel(err)) throw err
    }
  }
  throw lastError ?? new Error('All fallback models failed')
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const originError = requireSameOrigin(request)
  if (originError) return originError

  const { user, error: authError } = await requireUser(request)
  if (authError) return authError as NextResponse

  const { limited, error: rateLimitError } = rateLimit(`/api/gemini/grade-production:${user.id}`, {
    max: 30,
    windowMs: 60_000,
    meta: { endpoint: '/api/gemini/grade-production', userId: user.id },
  })
  if (limited) return rateLimitError as NextResponse

  const { data: body, error: validationError } = await validateBody(request, GradeProductionSchema)
  if (validationError) return validationError as NextResponse

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'AI service unavailable' }, { status: 503 })
  }

  try {
    const ai = new GoogleGenAI({ apiKey })
    const prompt = buildGradeProductionUserPrompt(body)
    const grade = await gradeWithFallback(ai, prompt)
    return NextResponse.json(grade)
  } catch (err: unknown) {
    const status = getErrorStatus(err) ?? 500
    const message = String((err as { message?: unknown })?.message ?? 'Internal server error')
    console.error('grade-production error:', err)
    return NextResponse.json({ error: message }, { status })
  }
}
