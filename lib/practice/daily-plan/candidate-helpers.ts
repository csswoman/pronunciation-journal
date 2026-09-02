import type { DailySelectionReason, DailyStep } from '@/lib/practice/types'
import type { Sound } from '@/lib/phoneme-practice/types'

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
