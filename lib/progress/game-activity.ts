import { recordActivitySession } from '@/lib/progress/activity-hub'
import type { ActivitySource } from '@/lib/progress/activity-types'
import type { SessionResult } from '@/lib/practice/types'

type GameActivitySource = Extract<ActivitySource, 'games' | 'word_rain' | 'word_search'>

export async function recordGameActivity(
  userId: string,
  source: GameActivitySource,
  totalTimeMs: number,
  gameId: string,
): Promise<void> {
  const sessionResult: SessionResult = {
    results: [],
    accuracy: 0,
    totalTimeMs: Math.max(0, Math.round(totalTimeMs)),
    bySlug: {} as SessionResult['bySlug'],
  }

  await recordActivitySession(userId, {
    practiceContext: 'practice',
    source,
    allowEmptySession: true,
    explicitSkillTags: ['vocabulary'],
    sessionResult,
    metadata: { gameId },
  })
}
