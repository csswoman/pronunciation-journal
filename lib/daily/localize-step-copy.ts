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

export function localizeDailyPlanSubtitles<T extends { steps: Array<{ title: string; subtitle: string }> }>(
  plan: T,
): T {
  return {
    ...plan,
    steps: plan.steps.map((step) => ({
      ...step,
      title: localizeDailyStepTitle(step.title),
      subtitle: localizeDailyStepSubtitle(step.subtitle),
    })),
  }
}
