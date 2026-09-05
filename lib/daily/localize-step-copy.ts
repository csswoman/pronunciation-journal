import { sortStepsByPedagogicalProgression } from '@/lib/practice/daily-plan/candidate-helpers'

/**
 * Ensures daily-step chrome stays correctly localized even if an older
 * localStorage plan is somehow still present.
 *
 * Rule: concept-teaching titles stay English (Sound, Minimal pairs, Listen and write).
 * Scaffolding/review titles → Spanish. Subtitles always Spanish.
 */

const EN_SOUND_AS_IN =
  /^Practice the sound as in ["“']([^"”']+)["”']$/i
const EN_SOUND_WEAK = /^Your sound to strengthen today$/i
const EN_MINIMAL = /^Tell (.+) apart from similar sounds$/i
const EN_DICTATION = /^Dictation with new words$/i

const TITLE_ES: Record<string, string> = {
  'New words': 'Palabras nuevas',
  'Word review': 'Repaso de palabras',
  'Context practice': 'Práctica en contexto',
  'Connected speech': 'Habla conectada',
  'Sentence builder': 'Constructor de oraciones',
  Reading: 'Lectura',
}

/** Rewrite known English subtitle leftovers → Spanish. Idempotent. */
export function localizeDailyStepSubtitle(subtitle: string): string {
  const asIn = subtitle.match(EN_SOUND_AS_IN)
  if (asIn) return `Practica el sonido como en '${asIn[1]}'`

  if (EN_SOUND_WEAK.test(subtitle)) return 'Tu sonido a reforzar hoy'

  const minimal = subtitle.match(EN_MINIMAL)
  if (minimal) return `Distingue ${minimal[1]} de sonidos parecidos`

  if (EN_DICTATION.test(subtitle)) return 'Dictado con palabras nuevas'

  return subtitle
}

/** Scaffolding/review titles → Spanish; concept titles unchanged. */
export function localizeDailyStepTitle(title: string): string {
  return TITLE_ES[title] ?? title
}

export function localizeDailyPlanSubtitles<
  T extends {
    steps: Array<{
      id?: string
      kind?: string
      title: string
      subtitle: string
      ipa?: string
      grammarRule?: { title?: string; goal?: string }
      featuredWords?: string[]
      studyCards?: Array<{ word: string }>
    }>
  },
>(plan: T): T {
  const updatedSteps = plan.steps.map((step) => {
    let title = localizeDailyStepTitle(step.title)
    let subtitle = localizeDailyStepSubtitle(step.subtitle)

    if (title === 'Estructura del día' || step.kind === 'grammar_focus') {
      if (step.grammarRule?.title) {
        title = `Estructura: ${step.grammarRule.title}`
      }
      if (step.grammarRule?.goal && step.grammarRule.goal !== step.grammarRule.title) {
        subtitle = step.grammarRule.goal
      } else if (!subtitle || subtitle === step.grammarRule?.title || subtitle === title) {
        subtitle = 'Aplica la regla en oraciones y pronunciación'
      }
    } else if (title === 'Práctica de sonido' || step.kind === 'phoneme_focus') {
      if (step.ipa) {
        title = `Práctica del sonido /${step.ipa.replace(/^\/+|\/+$/g, '')}/`
      } else {
        const soundMatch = subtitle.match(/(\/[^/]+\/)/)
        if (soundMatch) {
          title = `Práctica del sonido ${soundMatch[1]}`
        }
      }
    } else if (title === 'Estudia teoría' || step.kind === 'study_deck') {
      if (title === 'Estudia teoría' && subtitle && !subtitle.startsWith('Teoría:')) {
        title = `Teoría: ${subtitle}`
        subtitle = 'Explicación de la regla y ejemplos clave'
      } else if (title.startsWith('Teoría:')) {
        const rawTitle = title.replace(/^Teoría:\s*/, '')
        if (!subtitle || subtitle === rawTitle || subtitle === title) {
          subtitle = 'Explicación de la regla y ejemplos clave'
        }
      }
    }

    if (
      step.kind === 'word_intro' ||
      title === 'Palabras nuevas' ||
      /^(\d+)\s+palabras nuevas para conocer hoy$/i.test(subtitle) ||
      /^(\d+)\s+new words to learn today$/i.test(subtitle)
    ) {
      const words = step.featuredWords ?? step.studyCards?.map((c) => c.word)
      if (words && words.length > 0) {
        subtitle = `${words.join(', ')} · ${words.length} ${words.length === 1 ? 'palabra nueva' : 'palabras nuevas'}`
      }
    } else if (step.id === 'journal_entry' || title === 'Escribe en tu diario') {
      subtitle = 'Sugerencia opcional · Reflexión al final del día'
    }

    return {
      ...step,
      title,
      subtitle,
    }
  })

  // Ensure steps (including journal) are sorted in correct pedagogical order (journal always last)
  const sortedSteps = sortStepsByPedagogicalProgression(updatedSteps as unknown as import('@/lib/practice/types').DailyStep[])

  return {
    ...plan,
    steps: sortedSteps as unknown as T['steps'],
  }
}
