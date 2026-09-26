import { NextRequest, NextResponse } from 'next/server'
import { requireSameOrigin, requireUser, checkLayeredRateLimit, validateBody } from '@/lib/api/guards'
import { callGeminiJson, parseGeminiJson } from '@/lib/gemini/json-route'
import { JOURNAL_CORRECTION_SYSTEM_PROMPT, buildJournalCorrectionPrompt } from '@/lib/ai-prompts'
import { getUserInterests } from '@/lib/users/server-queries'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import {
  journalCorrectRequestSchema,
  journalCorrectionResultSchema,
  limitJournalCorrectionErrors,
} from '@/lib/journal/correction'
import type { ScheduledTopic } from '@/lib/journal/correction'
import { applyJournalFeedback } from '@/lib/journal/apply-feedback'
import { QUALITY_FALLBACK_MODELS } from '@/lib/gemini/fallback'
import { getEffectiveLearnerLevelServer } from '@/lib/learner-level/server-queries'

export async function POST(request: NextRequest): Promise<NextResponse> {
  const origin = requireSameOrigin(request); if (origin) return origin
  const { user, error } = await requireUser(request); if (error) return error as NextResponse
  const limited = await checkLayeredRateLimit({ request, user, endpoint: '/api/gemini/journal-correct', maxPermanent: 10, maxAnonymous: 3 }); if (limited.limited) return limited.error as NextResponse
  const parsed = await validateBody(request, journalCorrectRequestSchema); if (parsed.error) return parsed.error as NextResponse

  const supabase = await createSupabaseServerClient()
  // journal_entries was added after the checked-in generated database types.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- generated types predate journal_entries.
  const entries = supabase.from('journal_entries' as never) as any
  const { data: entry, error: entryError } = await entries.select('id, status').eq('id', parsed.data.entryId).eq('user_id', user.id).maybeSingle()
  if (entryError || !entry) return NextResponse.json({ error: 'Journal entry not found' }, { status: 404 })
  if (entry.status !== 'submitted') return NextResponse.json({ error: 'Journal entry must be submitted before correction' }, { status: 409 })

  const interests = await getUserInterests(user.id)
  const learnerLevel = await getEffectiveLearnerLevelServer(user.id)
  const level = learnerLevel.source === 'unknown' || learnerLevel.source === 'starter_default'
    ? 'A2'
    : learnerLevel.level
  const result = await callGeminiJson({ endpoint: '/api/gemini/journal-correct', userId: user.id, params: { contents: buildJournalCorrectionPrompt(parsed.data.content, interests, level), config: { systemInstruction: JOURNAL_CORRECTION_SYSTEM_PROMPT, responseMimeType: 'application/json', temperature: 0.1, maxOutputTokens: 1400 } }, schema: journalCorrectionResultSchema, parse: (raw) => journalCorrectionResultSchema.parse(parseGeminiJson(raw, (json) => json)), fallbackOptions: { models: QUALITY_FALLBACK_MODELS }, failureMessage: 'Failed to correct journal entry' })
  if (result.response) return result.response
  const correction = limitJournalCorrectionErrors(result.data, level)

  let scheduledTopics: ScheduledTopic[] = []
  try {
    const applied = await applyJournalFeedback(supabase, { userId: user.id, entryId: parsed.data.entryId, correction })
    // A lost race (entry already corrected) must not surface a fresh correction.
    if (!applied.applied) return NextResponse.json({ error: 'Journal entry must be submitted before correction' }, { status: 409 })
    scheduledTopics = applied.scheduledTopics
  } catch {
    return NextResponse.json({ error: 'Failed to save journal correction' }, { status: 500 })
  }

  return NextResponse.json({
    ...correction,
    scheduled: {
      topics: scheduledTopics,
      // Suggested words remain opt-in and are scheduled by /api/words after
      // the learner explicitly adds them to the word bank.
      words: [],
    },
  })
}
