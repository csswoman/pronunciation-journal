import { NextRequest, NextResponse } from 'next/server'
import { requireSameOrigin, requireUser, checkLayeredRateLimit, validateBody } from '@/lib/api/guards'
import { callGeminiJson, parseGeminiJson } from '@/lib/gemini/json-route'
import {
  buildJournalNudgePrompt,
  JOURNAL_NUDGE_SYSTEM_PROMPT,
} from '@/lib/ai-prompts'
import {
  journalNudgeRequestSchema,
  journalNudgeResponseSchema,
} from '@/lib/journal/nudge'

export async function POST(request: NextRequest): Promise<NextResponse> {
  const origin = requireSameOrigin(request)
  if (origin) return origin

  const { user, error } = await requireUser(request)
  if (error) return error as NextResponse

  const limited = await checkLayeredRateLimit({
    request,
    user,
    endpoint: '/api/gemini/journal-nudge',
    maxPermanent: 10,
    maxAnonymous: 3,
  })
  if (limited.limited) return limited.error as NextResponse

  const parsed = await validateBody(request, journalNudgeRequestSchema)
  if (parsed.error) return parsed.error as NextResponse

  const result = await callGeminiJson({
    endpoint: '/api/gemini/journal-nudge',
    userId: user.id,
    params: {
      contents: buildJournalNudgePrompt({
        prompt: parsed.data.prompt,
        partialText: parsed.data.partial_text,
        cefrLevel: parsed.data.cefr_level,
        unusedSeedWords: parsed.data.unused_seed_words,
        targetLength: parsed.data.target_length,
      }),
      config: {
        systemInstruction: JOURNAL_NUDGE_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        temperature: 0.4,
        maxOutputTokens: 900,
      },
    },
    parse: (raw) => journalNudgeResponseSchema.parse(parseGeminiJson(raw, (json) => json)),
    failureMessage: 'Failed to generate journal nudge',
  })
  if (result.response) return result.response

  return NextResponse.json(result.data)
}
