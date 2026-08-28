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
  /** Dominios del léxico donde el usuario guarda palabras, más frecuente primero. */
  domains: string[]
}

export function emptyLearnerContext(): LearnerContext {
  return {
    cefr: DEFAULT_CEFR,
    recentTopics: [],
    weakTargets: [],
    strugglingWords: [],
    srsDueWords: [],
    domains: [],
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

  const [profileResult, domainsResult] = await Promise.allSettled([
    (async () => {
      const { loadSkillProfile } = await import('@/lib/progress/queries')
      return loadSkillProfile(userId)
    })(),
    (async () => {
      const { deriveDomainProfile } = await import('@/lib/lexicon/domain-profile')
      const { getWordCategoryIndex } = await import('@/lib/lexicon/categories')
      const { getWordBankSourceRefsServer } = await import('@/lib/word-bank/server-queries')
      const entries = await getWordBankSourceRefsServer(userId)
      return deriveDomainProfile(entries, getWordCategoryIndex())
    })(),
  ])

  const profile = profileResult.status === 'fulfilled' ? profileResult.value : null
  const domainProfile = domainsResult.status === 'fulfilled' ? domainsResult.value : null

  return {
    ...base,
    cefr: profile?.cefr ? normalizeCEFR(profile.cefr) : DEFAULT_CEFR,
    weakTargets: [],
    domains: (domainProfile?.domains ?? []).slice(0, 3).map((d) => d.label),
  }
}
