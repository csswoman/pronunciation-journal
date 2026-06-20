import type { SessionArc } from '@/lib/practice/types'

const MAX_SEED_WORDS = 6

/**
 * Build a seeded opening message for the AI coach from a session's arc.
 * Empty string means "open the coach with no seed" (generic).
 */
export function buildCoachPrefill(arc: SessionArc | undefined): string {
  if (!arc) return ''

  const words = arc.sessionWords.slice(0, MAX_SEED_WORDS)
  if (words.length > 0) {
    return `Let's practice using today's words: ${words.join(', ')}. Ask me questions that make me use them.`
  }

  if (arc.topicLabel) {
    return `Let's have a conversation about ${arc.topicLabel}.`
  }

  return ''
}
