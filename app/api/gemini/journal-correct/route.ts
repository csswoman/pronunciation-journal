import { NextRequest, NextResponse } from 'next/server'
import { requireSameOrigin, requireUser, rateLimit, validateBody } from '@/lib/api/guards'
import { callGeminiJson, parseGeminiJson } from '@/lib/gemini/json-route'
import { JOURNAL_CORRECTION_SYSTEM_PROMPT, buildJournalCorrectionPrompt } from '@/lib/ai-prompts'
import { getUserInterests } from '@/lib/users/server-queries'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import {
  journalCorrectRequestSchema,
  journalCorrectionResultSchema,
} from '@/lib/journal/correction'
import { applyJournalFeedback } from '@/lib/journal/apply-feedback'

export async function POST(request: NextRequest): Promise<NextResponse> {
  const origin = requireSameOrigin(request); if (origin) return origin
  const { user, error } = await requireUser(request); if (error) return error as NextResponse
  const limited = await rateLimit(`/api/gemini/journal-correct:${user.id}`, { max: 10, windowMs: 60_000, meta: { endpoint: '/api/gemini/journal-correct', userId: user.id } }); if (limited.limited) return limited.error as NextResponse
  const parsed = await validateBody(request, journalCorrectRequestSchema); if (parsed.error) return parsed.error as NextResponse

  const supabase = await createSupabaseServerClient()
  // journal_entries was added after the checked-in generated database types.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- generated types predate journal_entries.
  const entries = supabase.from('journal_entries' as never) as any
  const { data: entry, error: entryError } = await entries.select('id, status').eq('id', parsed.data.entryId).eq('user_id', user.id).maybeSingle()
  if (entryError || !entry) return NextResponse.json({ error: 'Journal entry not found' }, { status: 404 })
  if (entry.status !== 'submitted') return NextResponse.json({ error: 'Journal entry must be submitted before correction' }, { status: 409 })

  const interests = await getUserInterests(user.id)
  const result = await callGeminiJson({ endpoint: '/api/gemini/journal-correct', userId: user.id, params: { contents: buildJournalCorrectionPrompt(parsed.data.content, interests), config: { systemInstruction: JOURNAL_CORRECTION_SYSTEM_PROMPT, responseMimeType: 'application/json', temperature: 0.1, maxOutputTokens: 1400 } }, parse: (raw) => journalCorrectionResultSchema.parse(parseGeminiJson(raw, (json) => json)), failureMessage: 'Failed to correct journal entry' })
  if (result.response) return result.response

  try {
    const applied = await applyJournalFeedback(supabase, { userId: user.id, entryId: parsed.data.entryId, correction: result.data })
    // A lost race (entry already corrected) must not surface a fresh correction.
    if (!applied.applied) return NextResponse.json({ error: 'Journal entry must be submitted before correction' }, { status: 409 })
  } catch {
    return NextResponse.json({ error: 'Failed to save journal correction' }, { status: 500 })
  }

  return NextResponse.json(result.data)
}
