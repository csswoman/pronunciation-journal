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
 * We allow at most 2 pronunciation steps per session, split into two separate
 * buckets (1 perception + 1 production):
 * - Perception: minimal_pairs, listening (max 1)
 * - Production: phoneme_focus, connected_speech (max 1)
 *
 * This ensures perception and production do not starve each other, aligning with
 * the focus on hearing and replicating sounds.
 */
export const MAX_PERCEPTION_STEPS = 1
export const MAX_PRODUCTION_STEPS = 1
export const MAX_PRONUNCIATION_STEPS = 2

export const PERCEPTION_KINDS: readonly DailyStep['kind'][] = [
  'minimal_pairs',
  'listening',
]

export const PRODUCTION_KINDS: readonly DailyStep['kind'][] = [
  'phoneme_focus',
  'connected_speech',
]

/** Keep at most 1 perception and 1 production pronunciation step, order preserved. */
export function capPronunciationSteps(steps: DailyStep[]): DailyStep[] {
  let perceptionCount = 0
  let productionCount = 0
  return steps.filter((step) => {
    if (PERCEPTION_KINDS.includes(step.kind)) {
      perceptionCount += 1
      return perceptionCount <= MAX_PERCEPTION_STEPS
    }
    if (PRODUCTION_KINDS.includes(step.kind)) {
      productionCount += 1
      return productionCount <= MAX_PRODUCTION_STEPS
    }
    return true
  })
}

