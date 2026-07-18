import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireSameOrigin, requireUser, rateLimit, validateBody } from '@/lib/api/guards'
import { callGeminiJson, parseGeminiJson } from '@/lib/gemini/json-route'
import { JOURNAL_CORRECTION_SYSTEM_PROMPT, buildJournalCorrectionPrompt } from '@/lib/ai-prompts'
import { getUserInterests } from '@/lib/users/server-queries'

const requestSchema = z.object({ entryId: z.string().uuid(), content: z.string().min(1).max(4000) }).strict()
const responseSchema = z.object({ correctedContent: z.string().min(1).max(6000), errors: z.array(z.object({ quote: z.string().max(300), correction: z.string().max(300), type: z.string().max(80), explanationEs: z.string().max(500), topic: z.string().max(120) }).strict()).max(8), newWords: z.array(z.string().max(80)).max(8) }).strict()

export async function POST(request: NextRequest): Promise<NextResponse> {
  const origin = requireSameOrigin(request); if (origin) return origin
  const { user, error } = await requireUser(request); if (error) return error as NextResponse
  const limited = await rateLimit(`/api/gemini/journal-correct:${user.id}`, { max: 10, windowMs: 60_000, meta: { endpoint: '/api/gemini/journal-correct', userId: user.id } }); if (limited.limited) return limited.error as NextResponse
  const parsed = await validateBody(request, requestSchema); if (parsed.error) return parsed.error as NextResponse
  const interests = await getUserInterests(user.id)
  const result = await callGeminiJson({ endpoint: '/api/gemini/journal-correct', userId: user.id, params: { contents: buildJournalCorrectionPrompt(parsed.data.content, interests), config: { systemInstruction: JOURNAL_CORRECTION_SYSTEM_PROMPT, responseMimeType: 'application/json', temperature: 0.1, maxOutputTokens: 1400 } }, parse: (raw) => responseSchema.parse(parseGeminiJson(raw, (json) => json)), failureMessage: 'Failed to correct journal entry' })
  if (result.response) return result.response
  return NextResponse.json(result.data)
}
