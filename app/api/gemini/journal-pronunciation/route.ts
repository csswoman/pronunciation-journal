import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireSameOrigin, requireUser, checkLayeredRateLimit, validateBody } from '@/lib/api/guards'
import { callGeminiJson, parseGeminiJson } from '@/lib/gemini/json-route'
import {
  JOURNAL_PRONUNCIATION_SYSTEM_PROMPT,
  buildJournalPronunciationUserPrompt,
} from '@/lib/ai-prompts'

const journalPronunciationRequestSchema = z.object({
  wordOrPhrase: z.string().min(1).max(150),
})

export const journalPronunciationResponseSchema = z.object({
  wordOrPhrase: z.string().optional(),
  ipa: z.string(),
  syllableStress: z.string(),
  suggestedReason: z.enum([
    'difficult_sound',
    'syllable_stress',
    'tricky_spelling',
    'new_word',
    'other',
  ]),
  explanationEs: z.string(),
  phoneticTrap: z.string().optional(),
})

export async function POST(request: NextRequest): Promise<NextResponse> {
  const originError = requireSameOrigin(request)
  if (originError) return originError

  const { user, error: authError } = await requireUser(request)
  if (authError) return authError as NextResponse

  const limited = await checkLayeredRateLimit({
    request,
    user,
    endpoint: '/api/gemini/journal-pronunciation',
    maxPermanent: 20,
    maxAnonymous: 5,
  })
  if (limited.limited) return limited.error as NextResponse

  const parsed = await validateBody(request, journalPronunciationRequestSchema)
  if (parsed.error) return parsed.error as NextResponse

  const wordOrPhrase = parsed.data.wordOrPhrase.trim()

  const result = await callGeminiJson({
    endpoint: '/api/gemini/journal-pronunciation',
    userId: user.id,
    params: {
      contents: buildJournalPronunciationUserPrompt(wordOrPhrase),
      config: {
        systemInstruction: JOURNAL_PRONUNCIATION_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        temperature: 0.1,
        maxOutputTokens: 600,
      },
    },
    parse: (raw) =>
      journalPronunciationResponseSchema.parse(
        parseGeminiJson(raw, (json) => json)
      ),
    failureMessage: 'Failed to analyze pronunciation for journal entry',
  })

  if (result.response) return result.response

  return NextResponse.json({
    wordOrPhrase,
    ...result.data,
  })
}
