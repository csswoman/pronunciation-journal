import { recordActivitySession } from '@/lib/progress/activity-hub'
import {
  IMMERSION_MEDIA_SKILLS,
  type ImmersionMediaType,
  type SkillTag,
} from '@/lib/progress/activity-types'

export interface ExternalImmersionInput {
  type: ImmersionMediaType
  minutes: number
  notes?: string
}

export interface ExternalImmersionResult {
  skills: readonly SkillTag[]
  xpEarned: number
  minutes: number
  reconciledStepIds: string[]
}

/**
 * Registra una sesión de inmersión externa (YouTube, series, podcasts, lectura)
 * asociándola a las habilidades correspondientes y sumando XP y tiempo al progreso.
 */
export async function logExternalImmersion(
  userId: string,
  input: ExternalImmersionInput,
): Promise<ExternalImmersionResult> {
  const minutes = Math.max(1, input.minutes)
  const skills = IMMERSION_MEDIA_SKILLS[input.type] ?? ['listening']
  const xpEarned = Math.max(10, Math.round(minutes * 1))
  const durationMs = minutes * 60 * 1000

  const outcome = await recordActivitySession(userId, {
    practiceContext: 'practice',
    source: 'immersion',
    allowEmptySession: true,
    explicitSkillTags: [...skills],
    explicitXp: xpEarned,
    sessionResult: {
      results: [],
      accuracy: 100,
      totalTimeMs: durationMs,
      bySlug: {} as import('@/lib/practice/types').SessionResult['bySlug'],
    },
    metadata: {
      mediaType: input.type,
      notes: input.notes,
    },
  })

  return {
    skills,
    xpEarned,
    minutes,
    reconciledStepIds: outcome.reconciledStepIds,
  }
}
