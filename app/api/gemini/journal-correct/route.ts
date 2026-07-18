import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireSameOrigin, requireUser, rateLimit, validateBody } from '@/lib/api/guards'
import { callGeminiJson, parseGeminiJson } from '@/lib/gemini/json-route'
import { JOURNAL_CORRECTION_SYSTEM_PROMPT, buildJournalCorrectionPrompt } from '@/lib/ai-prompts'
import { getUserInterests } from '@/lib/users/server-queries'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { normalizeTopic } from '@/lib/practice/normalize-topic'

const requestSchema = z.object({ entryId: z.string().uuid(), content: z.string().min(1).max(4000) }).strict()
const responseSchema = z.object({ correctedContent: z.string().min(1).max(6000), errors: z.array(z.object({ quote: z.string().max(300), correction: z.string().max(300), type: z.string().max(80), explanationEs: z.string().max(500), topic: z.string().max(120) }).strict()).max(8), newWords: z.array(z.string().max(80)).max(8) }).strict()

export async function POST(request: NextRequest): Promise<NextResponse> {
  const origin = requireSameOrigin(request); if (origin) return origin
  const { user, error } = await requireUser(request); if (error) return error as NextResponse
  const limited = await rateLimit(`/api/gemini/journal-correct:${user.id}`, { max: 10, windowMs: 60_000, meta: { endpoint: '/api/gemini/journal-correct', userId: user.id } }); if (limited.limited) return limited.error as NextResponse
  const parsed = await validateBody(request, requestSchema); if (parsed.error) return parsed.error as NextResponse
  const supabase = await createSupabaseServerClient()
  // journal_entries was added after the checked-in generated database types.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- generated types predate journal_entries.
  const entries = supabase.from('journal_entries' as never) as any
  const { data: entry, error: entryError } = await entries.select('id, status').eq('id', parsed.data.entryId).eq('user_id', user.id).maybeSingle()
  if (entryError || !entry) return NextResponse.json({ error: 'Journal entry not found' }, { status: 404 })
  if (entry.status !== 'submitted') return NextResponse.json({ error: 'Journal entry must be submitted before correction' }, { status: 409 })
  const interests = await getUserInterests(user.id)
  const result = await callGeminiJson({ endpoint: '/api/gemini/journal-correct', userId: user.id, params: { contents: buildJournalCorrectionPrompt(parsed.data.content, interests), config: { systemInstruction: JOURNAL_CORRECTION_SYSTEM_PROMPT, responseMimeType: 'application/json', temperature: 0.1, maxOutputTokens: 1400 } }, parse: (raw) => responseSchema.parse(parseGeminiJson(raw, (json) => json)), failureMessage: 'Failed to correct journal entry' })
  if (result.response) return result.response
  const feedback = { errors: result.data.errors, newWords: result.data.newWords }
  const { error: updateError } = await entries.update({ status: 'corrected', corrected_content: result.data.correctedContent, feedback, updated_at: new Date().toISOString() }).eq('id', parsed.data.entryId).eq('user_id', user.id).eq('status', 'submitted')
  if (updateError) return NextResponse.json({ error: 'Failed to save journal correction' }, { status: 500 })
  const topics = [...new Set(result.data.errors.map((item) => normalizeTopic(item.topic) ?? 'grammar:other'))]
  await Promise.all(topics.map(async (topic) => {
    const { data } = await supabase.from('topic_srs').select('id, review_count').eq('user_id', user.id).eq('topic', topic).maybeSingle()
    if (data) await supabase.from('topic_srs').update({ review_count: (data.review_count ?? 0) + 1 }).eq('id', data.id).eq('user_id', user.id)
  }))
  return NextResponse.json(result.data)
}
