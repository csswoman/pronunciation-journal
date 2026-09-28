import { recordActivitySession } from '@/lib/progress/activity-hub'
import type { GameActivitySource, SkillTag } from '@/lib/progress/activity-types'
import type { ExerciseResult, ExerciseSlug, SessionResult } from '@/lib/practice/types'

export interface GameOutcome {
  hits: number
  misses: number
  /** Games report summary outcomes only; they never write to answer_history. */
  slug: ExerciseSlug
}

function buildGameSessionResult(
  totalTimeMs: number,
  gameId: string,
  outcome?: GameOutcome,
): SessionResult {
  const durationMs = Math.max(0, Math.round(totalTimeMs))
  if (!outcome) {
    return {
      results: [],
      accuracy: 0,
      totalTimeMs: durationMs,
      bySlug: {} as SessionResult['bySlug'],
    }
  }

  const total = outcome.hits + outcome.misses
  const perResultMs = total > 0 ? Math.round(durationMs / total) : 0
  const results: ExerciseResult[] = []

  for (let i = 0; i < outcome.hits; i++) {
    results.push({
      exerciseId: `${gameId}-${i}`,
      slug: outcome.slug,
      exerciseTypeId: null,
      isCorrect: true,
      timeMs: perResultMs,
      contentId: `${gameId}-${i}`,
      context: 'practice',
      completedAt: new Date(),
    })
  }
  for (let i = 0; i < outcome.misses; i++) {
    results.push({
      exerciseId: `${gameId}-miss-${i}`,
      slug: outcome.slug,
      exerciseTypeId: null,
      isCorrect: false,
      timeMs: perResultMs,
      contentId: `${gameId}-miss-${i}`,
      context: 'practice',
      completedAt: new Date(),
    })
  }

  return {
    results,
    accuracy: total > 0 ? (outcome.hits / total) * 100 : 0,
    totalTimeMs: durationMs,
    bySlug: {} as SessionResult['bySlug'],
  }
}

export async function recordGameActivity(
  userId: string,
  source: GameActivitySource,
  totalTimeMs: number,
  gameId: string,
  skillTags: SkillTag[] = ['vocabulary'],
  outcome?: GameOutcome,
): Promise<void> {
  await recordActivitySession(userId, {
    practiceContext: 'practice',
    source,
    allowEmptySession: true,
    explicitSkillTags: skillTags,
    sessionResult: buildGameSessionResult(totalTimeMs, gameId, outcome),
    metadata: { gameId },
  })
}
