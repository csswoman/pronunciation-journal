import type { DailyStep } from '@/lib/practice/types'

/** Cuántos pasos tiene la diaria. */
export const DAILY_PLAN_STEP_COUNT = 5

/** Cuántas palabras del word_bank intentamos traer para el paso de repaso. */
export const WORD_REVIEW_WORD_COUNT = 6

/** Ejercicios por paso de práctica (fonema, minimal pairs, listening). */
export const PHONEME_FOCUS_EXERCISE_COUNT = 4
export const MINIMAL_PAIRS_EXERCISE_COUNT = 3
export const LISTENING_EXERCISE_COUNT = 3
export const SENTENCE_BUILDER_EXERCISE_COUNT = 5
export const FALSE_FRIENDS_EXERCISE_COUNT = 4

/** Producciones habladas por sesión — el foco central de esta iteración. */
export const SPOKEN_PRODUCTION_PER_SESSION = 12
/** Frases de shadowing (calentamiento) antes de producción libre. */
export const WARMUP_PHRASE_COUNT = 4

/** Tope de palabras nuevas presentadas (noticing) por sesión — carga cognitiva. */
export const WORD_INTRO_MAX_CARDS = 5

/**
 * Pronunciation steps allowed per session.
 *
 * The pronunciation work in this app is good, but it was taking two or three
 * of five slots while grammar took none. An imperfect accent with fluent
 * sentences communicates; a perfect accent with freezes does not.
 */
export const MAX_PRONUNCIATION_STEPS = 1

const PRONUNCIATION_KINDS: readonly DailyStep['kind'][] = [
  'phoneme_focus',
  'minimal_pairs',
  'listening',
  'connected_speech',
]

/** Keep at most MAX_PRONUNCIATION_STEPS pronunciation steps, order preserved. */
export function capPronunciationSteps(steps: DailyStep[]): DailyStep[] {
  let seen = 0
  return steps.filter((step) => {
    if (!PRONUNCIATION_KINDS.includes(step.kind)) return true
    seen += 1
    return seen <= MAX_PRONUNCIATION_STEPS
  })
}

