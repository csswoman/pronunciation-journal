import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireSameOrigin, requireUser, rateLimit, validateBody } from '@/lib/api/guards'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getDeckBySlug } from '@/lib/courses/grammar-deck/decks'
import { deckSlugForTopic } from '@/lib/practice/topic-decks'
import { buildTopicReviewStep } from '@/lib/review/topic-review-step'

const schema = z.object({
  topic: z.string().min(1).max(120).optional(),
  topics: z.array(z.string().min(1).max(120)).max(12).optional(),
}).strict()

export async function POST(request: NextRequest) {
  const originError = requireSameOrigin(request)
  if (originError) return originError
  const { user, error } = await requireUser(request)
  if (error) return error
  const { limited, error: rateLimitError } = await rateLimit(`/api/review/topics:${user.id}`, {
    max: 60,
    windowMs: 60_000,
    meta: { endpoint: '/api/review/topics', userId: user.id },
  })
  if (limited) return rateLimitError
  const { data: body, error: validationError } = await validateBody(request, schema)
  if (validationError) return validationError
  let topics = body.topics ?? (body.topic ? [body.topic] : null)
  if (!topics) {
    const supabase = await createSupabaseServerClient()
    const { data } = await supabase.from('topic_srs').select('topic')
      .eq('user_id', user.id).lte('next_review_at', new Date().toISOString())
      .order('next_review_at').limit(2)
    topics = (data ?? []).map(({ topic }) => topic)
  }
  const steps = [...new Set(topics)].flatMap((topic) => {
    const slug = deckSlugForTopic(topic)
    const deck = slug ? getDeckBySlug(slug) : null
    const step = deck && slug ? buildTopicReviewStep(topic, slug, deck) : null
    return step ? [step] : []
  })
  return NextResponse.json({ steps })
}
