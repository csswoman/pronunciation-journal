import { GoogleGenAI } from '@google/genai'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  GENERATE_READER_SYSTEM_PROMPT,
  buildGenerateReaderUserPrompt,
} from '@/lib/ai-prompts'
import { requireUser, rateLimit, validateBody } from '@/lib/api/guards'
import { passageEmbedsTargets } from '@/lib/practice/reader/refinement'
import type { ReaderQuestion } from '@/lib/practice/reader/types'

const RequestSchema = z.object({
  targets: z.array(z.string().min(1).max(40)).min(1).max(10),
  level: z.string().min(2).max(4),
}).strict()

const ResponseSchema = z.object({
  passage: z.string().min(1).max(2000),
  topic: z.string().max(200),
  questions: z.array(z.object({
    prompt: z.string().min(1).max(500),
    options: z.array(z.string().min(1).max(200)).length(4),
    correctIndex: z.number().int().min(0).max(3),
  })).min(1).max(2),
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

interface ReaderResult { passage: string; topic: string; questions: ReaderQuestion[] }

function parse(raw: string): ReaderResult {
  const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  return ResponseSchema.parse(JSON.parse(cleaned))
}

async function generateWithFallback(
  ai: GoogleGenAI, prompt: string, targets: string[],
): Promise<ReaderResult> {
  let lastError: unknown
  for (const model of FALLBACK_MODELS) {
    try {
      const result = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction: GENERATE_READER_SYSTEM_PROMPT,
          responseMimeType: 'application/json',
          temperature: 0.6,
          maxOutputTokens: 1024,
        },
      })
      if (!result.text) throw new Error('Empty response from AI')
      const parsed = parse(result.text)
      // Refinement gate: reject (and try next model) if it failed to embed targets.
      if (!passageEmbedsTargets(parsed.passage, targets)) {
        throw Object.assign(new Error('refinement failed'), { statusCode: 422 })
      }
      return parsed
    } catch (err: unknown) {
      lastError = err
      const isRefinement = String((err as { message?: unknown })?.message ?? '').includes('refinement')
      if (!isRefinement && !shouldTryNextModel(err)) throw err
    }
  }
  throw lastError ?? new Error('All fallback models failed')
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { user, error: authError } = await requireUser()
  if (authError) return authError as NextResponse

  const { limited, error: rateLimitError } = rateLimit(`/api/gemini/generate-reader:${user.id}`, {
    max: 20, windowMs: 60_000, meta: { endpoint: '/api/gemini/generate-reader', userId: user.id },
  })
  if (limited) return rateLimitError as NextResponse

  const { data: body, error: validationError } = await validateBody(request, RequestSchema)
  if (validationError) return validationError as NextResponse

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'AI service unavailable' }, { status: 503 })

  try {
    const ai = new GoogleGenAI({ apiKey })
    const prompt = buildGenerateReaderUserPrompt({ targets: body.targets, level: body.level })
    const result = await generateWithFallback(ai, prompt, body.targets)
    return NextResponse.json(result)
  } catch (err: unknown) {
    const status = getErrorStatus(err) ?? 500
    const message = String((err as { message?: unknown })?.message ?? 'Internal server error')
    console.error('generate-reader error:', err)
    return NextResponse.json({ error: message }, { status })
  }
}
