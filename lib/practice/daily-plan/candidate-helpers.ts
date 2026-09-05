import type { DailySelectionReason, DailyStep } from '@/lib/practice/types'
import type { Sound } from '@/lib/phoneme-practice/types'
import type { UserLearningState } from '@/lib/ai-practice/learning-state'
import { pickSeedSound } from './selectors'

export function targetRefsForStep(
  step: DailyStep,
  primaryTarget: string | null,
  primarySound: Sound | null,
): string[] {
  if (step.kind === 'mission' && step.missionLaunch) return step.missionLaunch.targetIds
  if (['phoneme_focus', 'minimal_pairs', 'listening'].includes(step.kind)) {
    return [primaryTarget ?? `sound:${step.ipa ?? primarySound?.id ?? step.id}`]
  }
  if (step.kind === 'word_intro') return (step.featuredWords ?? []).map((word) => `exposure:word:${word}`)
  if (step.kind === 'word_review') return step.exercises.map((exercise) => `word-meaning:${exercise.sourceRef?.id ?? exercise.contentId}`)
  if (step.kind === 'context_practice') {
    return step.exercises.map((exercise) => `word-context:${exercise.sourceRef?.id ?? exercise.contentId}`)
  }
  if (step.kind === 'reader') {
    return step.readerPassage ? [`reader:${step.readerPassage.id}`] : [step.id]
  }
  if (step.kind === 'study_deck' || step.kind === 'concept') return [step.id]
  return step.exercises.length > 0 ? step.exercises.map((exercise) => exercise.contentId) : [step.id]
}

export function reasonForStep(
  step: DailyStep,
  options: {
    hasDueSrs: boolean
    hasProgress: boolean
    weakTopic?: string
    hasSavedOrFamiliar: boolean
  },
): DailySelectionReason {
  if (step.kind === 'grammar_focus') return 'grammar_slot'
  if (step.kind === 'mission') return 'grammar_slot'
  if (step.id.startsWith('review_') || (options.hasDueSrs && step.kind === 'word_review')) return 'due'
  if (step.id.includes('failed') || (step.kind === 'sentence_builder' && options.weakTopic)) return 'recent_error'
  if (options.hasProgress && ['phoneme_focus', 'minimal_pairs', 'listening'].includes(step.kind)) return 'weak_target'
  if (step.kind === 'study_deck' || step.kind === 'reader') return 'route_next'
  if (step.kind === 'word_review' && options.hasSavedOrFamiliar) return 'saved_intent'
  return 'variety'
}

/**
 * Ordena los pasos seleccionados según la progresión pedagógica de adquisición:
 * 1. Discriminación auditiva / Pares mínimos (calentamiento de percepción)
 * 2. Foco fonético (articulación de sonido)
 * 3. Comprensión / Gramática / Lectura (input comprensible i+1)
 * 4. Presentación / Repaso de vocabulario
 * 5. Producción guiada / libre (oral/escrita)
 * 6. Misión / Diario reflexivo (aplicación libre)
 */
const PEDAGOGICAL_KIND_ORDER: Record<string, number> = {
  minimal_pairs: 1,
  listening: 1,
  phoneme_focus: 2,
  concept: 3,
  study_deck: 3,
  reader: 3,
  grammar_focus: 4,
  sentence_context: 4,
  context_practice: 4,
  word_intro: 5,
  word_review: 5,
  written_production: 6,
  spoken_production: 6,
  mission: 7,
  journal_entry: 8,
}

export function sortStepsByPedagogicalProgression(steps: DailyStep[]): DailyStep[] {
  return [...steps].sort((a, b) => {
    const orderA = a.id === 'journal_entry' ? 99 : (PEDAGOGICAL_KIND_ORDER[a.kind] ?? 4)
    const orderB = b.id === 'journal_entry' ? 99 : (PEDAGOGICAL_KIND_ORDER[b.kind] ?? 4)
    return orderA - orderB
  })
}

/**
 * Resuelve el sonido primario del día respetando el bucle adaptativo SLA:
 * 1. Prioridad máxima: fonema con fallos orales reiterados (≥2 intentos, <65% precisión) en producción oral.
 *    Esto fuerza un paso de discriminación auditiva (pares mínimos) antes de volver a exigir producción oral.
 * 2. Prescripción de evaluación diagnóstica activa (diagnosticSound).
 * 3. Sonido más débil en progreso general histórico (weakest).
 * 4. Sonido con dificultades acumuladas en el coach de IA.
 * 5. Sonido semilla determinista del día.
 */
export function resolvePrimarySound(
  weakest: Sound | null,
  aiState: UserLearningState | null,
  allSounds: Sound[],
  diagnosticSound: Sound | null = null,
): Sound | null {
  if (aiState?.pronunciation?.strugglingSounds) {
    const urgentOralSound = [...aiState.pronunciation.strugglingSounds]
      .filter((s) => s.attempts >= 2 && s.avgAccuracy < 65)
      .sort((a, b) => a.avgAccuracy - b.avgAccuracy)[0]
    if (urgentOralSound) {
      const match = allSounds.find((s) => s.ipa === urgentOralSound.ipa)
      if (match) return match
    }
  }

  if (diagnosticSound) return diagnosticSound

  if (weakest) return weakest

  if (aiState?.pronunciation?.strugglingSounds) {
    const worstSound = [...aiState.pronunciation.strugglingSounds]
      .filter((s) => s.attempts >= 3 && s.avgAccuracy < 70)
      .sort((a, b) => a.avgAccuracy - b.avgAccuracy)[0]
    if (worstSound) {
      const match = allSounds.find((s) => s.ipa === worstSound.ipa)
      if (match) return match
    }
  }

  return pickSeedSound(allSounds, 0)
}
