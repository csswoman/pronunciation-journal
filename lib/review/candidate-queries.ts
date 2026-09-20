import 'server-only'

import { getDeckBySlug } from '@/lib/courses/grammar-deck/decks'
import { deckSlugForTopic } from '@/lib/practice/topic-decks'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { buildTopicReviewStep } from '@/lib/review/topic-review-step'
import type { EssentialWordReviewItem, TopicSrsRow } from '@/lib/review/types'

export function filterReviewableTopics(topics: TopicSrsRow[]): TopicSrsRow[] {
  return topics.filter(({ topic }) => {
    try {
      const slug = deckSlugForTopic(topic)
      const deck = slug ? getDeckBySlug(slug) : null
      return Boolean(deck && slug && buildTopicReviewStep(topic, slug, deck))
    } catch (error) {
      console.error('[review] topic is not currently executable', { topic, error })
      return false
    }
  })
}

export async function getDueEssentialWords(
  userId: string,
  limit = 12,
): Promise<EssentialWordReviewItem[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('learning_items')
    .select('id, word_id, skill, due_at')
    .eq('user_id', userId)
    .eq('suspended', false)
    .not('due_at', 'is', null)
    .lte('due_at', new Date().toISOString())
    .order('due_at', { ascending: true })
    .limit(limit)

  if (error) {
    console.error('[review] getDueEssentialWords failed', error)
    return []
  }

  return (data ?? []).flatMap((row) => {
    if (!row.due_at) return []
    if (!['meaning', 'listening', 'production', 'usage'].includes(row.skill)) return []
    return [{
      id: row.id,
      wordId: row.word_id,
      word: row.word_id.replace(/^c1k:/, ''),
      skill: row.skill as EssentialWordReviewItem['skill'],
      dueAt: row.due_at,
    }]
  })
}
