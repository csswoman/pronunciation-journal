import type { CEFRLevel } from '@/lib/exercises/cefr'
import { normalizeCEFR } from '@/lib/exercises/cefr'
import type { PronunciationTargetId } from '@/lib/pronunciation/targets/types'
import { phonemeTargetId } from '@/lib/pronunciation/targets/registry'

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
  /**
   * Áreas de vocabulario que se le resisten, la más dura primero.
   *
   * Distinto de `domains`: aquello mide dónde colecciona palabras, esto mide
   * dónde las olvida. Es el grano con el que se puede armar una lección.
   */
  weakDomains: string[]
}

export function emptyLearnerContext(): LearnerContext {
  return {
    cefr: DEFAULT_CEFR,
    recentTopics: [],
    weakTargets: [],
    strugglingWords: [],
    srsDueWords: [],
    domains: [],
    weakDomains: [],
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

  const [profileResult, lexiconResult, vocabResult, stateResult] =
    await Promise.allSettled([
      (async () => {
        const { loadSkillProfile } = await import('@/lib/progress/queries')
        return loadSkillProfile(userId)
      })(),
      // Ambas mitades del perfil léxico comparten el catálogo de categorías.
      // Importarlo dos veces en paralelo hace que las ramas compitan por
      // resolverlo, así que se leen juntas.
      (async () => {
        const { deriveDomainProfile } = await import('@/lib/lexicon/domain-profile')
        const { deriveWeakDomains } = await import('@/lib/lexicon/weak-domains')
        const { getWordCategoryIndex, getCategories } = await import('@/lib/lexicon/categories')
        const { getWordBankSourceRefsServer, getStrugglingWordBankRefs } = await import(
          '@/lib/word-bank/server-queries'
        )
        const [entries, strugglingRows] = await Promise.all([
          getWordBankSourceRefsServer(userId),
          getStrugglingWordBankRefs(userId),
        ])
        const wordIndex = getWordCategoryIndex()
        const names = new Map(getCategories().map((c) => [c.id, c.name]))
        return {
          profile: deriveDomainProfile(entries, wordIndex),
          weak: deriveWeakDomains(strugglingRows, wordIndex, names),
        }
      })(),
      (async () => {
        const { getWordsDueForReview, getWeakWordsForReviewServer } = await import(
          '@/lib/word-bank/server-queries'
        )
        // Ambas listas salen del mismo módulo: una sola importación evita que
        // las dos llamadas compitan por resolverlo.
        const [due, weak] = await Promise.all([
          getWordsDueForReview(userId, 8),
          getWeakWordsForReviewServer(userId, 6),
        ])
        return { due, weak }
      })(),
      (async () => {
        const { fetchServerLearningState } = await import('@/lib/ai-practice/server-state')
        return fetchServerLearningState(userId, null)
      })(),
    ])

  const profile = profileResult.status === 'fulfilled' ? profileResult.value : null
  const lexicon = lexiconResult.status === 'fulfilled' ? lexiconResult.value : null
  const domainProfile = lexicon?.profile ?? null
  const vocab = vocabResult.status === 'fulfilled' ? vocabResult.value : null
  const dueWords = vocab?.due ?? []
  const weakWords = vocab?.weak ?? []
  const state = stateResult.status === 'fulfilled' ? stateResult.value : null
  const weakDomains = lexicon?.weak ?? []

  const weakTargets: PronunciationTargetId[] = (profile?.weakestPhonemes ?? [])
    .slice(0, 3)
    .map((p) => {
      try {
        return phonemeTargetId(p.ipa)
      } catch {
        return null
      }
    })
    .filter((t): t is PronunciationTargetId => t !== null)

  return {
    ...base,
    cefr: profile?.cefr ? normalizeCEFR(profile.cefr) : DEFAULT_CEFR,
    weakTargets,
    // Vocabulario vencido: el guión lo obliga a producirlo, que es donde el
    // reconocimiento pasivo se convierte en uso activo.
    srsDueWords: dueWords.map((w) => w.text).filter(Boolean).slice(0, 8),
    // Palabras con peor ease factor: las que más se resisten.
    strugglingWords: weakWords.map((w) => w.text).filter(Boolean).slice(0, 6),
    // Lo ya cubierto, para que el guión no repita el mismo tema.
    recentTopics: (state?.lastSessions ?? []).slice(0, 5).map((s) => s.topic).filter(Boolean),
    domains: (domainProfile?.domains ?? []).slice(0, 3).map((d) => d.label),
    // Dónde el vocabulario se le resiste de verdad: el coach apunta aquí antes
    // que a un dominio amplio donde ya va bien.
    weakDomains: weakDomains.slice(0, 3).map((d) => d.label),
  }
}
