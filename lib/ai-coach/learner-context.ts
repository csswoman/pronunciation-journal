import type { CEFRLevel } from '@/lib/exercises/cefr'
import { normalizeCEFR } from '@/lib/exercises/cefr'
import type { PronunciationTargetId } from '@/lib/pronunciation/targets/types'

/** Nivel asumido sin datos: ni tan bajo que aburra, ni tan alto que bloquee. */
const DEFAULT_CEFR: CEFRLevel = 'A2'

export interface LearnerContext {
  cefr: CEFRLevel
  recentTopics: string[]
  weakTargets: PronunciationTargetId[]
  strugglingWords: string[]
  /** Vocabulario en repaso, para que el guión lo obligue a producirlo. */
  srsDueWords: string[]
}

export function emptyLearnerContext(): LearnerContext {
  return {
    cefr: DEFAULT_CEFR,
    recentTopics: [],
    weakTargets: [],
    strugglingWords: [],
    srsDueWords: [],
  }
}

/**
 * Snapshot de lectura pura sobre fuentes que ya son dueñas de esta verdad.
 * No crea tabla de perfil: duplicar esa verdad la haría divergir.
 *
 * Nunca lanza — sin datos, la generación sigue funcionando, solo menos
 * personalizada.
 */
export async function buildLearnerContext(userId: string): Promise<LearnerContext> {
  const base = emptyLearnerContext()

  try {
    const { loadSkillProfile } = await import('@/lib/progress/queries')
    const profile = await loadSkillProfile(userId)
    if (!profile) return base

    return {
      ...base,
      cefr: profile.cefr ? normalizeCEFR(profile.cefr) : DEFAULT_CEFR,
      weakTargets: [],
    }
  } catch {
    return base
  }
}
