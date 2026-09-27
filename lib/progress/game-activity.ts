import { recordActivitySession } from '@/lib/progress/activity-hub'
import type { GameActivitySource, SkillTag } from '@/lib/progress/activity-types'
import type { SessionResult } from '@/lib/practice/types'

export async function recordGameActivity(
  userId: string,
  source: GameActivitySource,
  totalTimeMs: number,
  gameId: string,
  skillTags: SkillTag[] = ['vocabulary'],
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
    explicitSkillTags: skillTags,
    sessionResult,
    metadata: { gameId },
  })
}
