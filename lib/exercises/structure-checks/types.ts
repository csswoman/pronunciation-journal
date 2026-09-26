import type { CEFRLevel } from '@/lib/exercises/cefr'

export type StructureCheckId =
  | 'contraction'
  | 'negative'
  | 'yes_no_question'
  | 'wh_question'
  | 'past_simple'
  | 'past_continuous'
  | 'present_perfect'
  | 'past_perfect'
  | 'going_to_future'
  | 'will_future'
  | 'comparative'
  | 'superlative'
  | 'passive'
  | 'relative_clause'
  | 'first_conditional'
  | 'second_conditional'
  | 'third_conditional'
  | 'mixed_conditional'
  | 'wish_past'
  | 'wish_past_perfect'
  | 'modal_perfect'
  | 'reported_speech'
  | 'participle_clause'
  | 'negative_inversion'
  | 'cleft_what'
  | 'cleft_it'

export interface StructureCheck {
  id: StructureCheckId
  minLevel: CEFRLevel
  labelEs: string
  hintEs: string
  checkEn: string
  test: (tokens: string[]) => boolean
}
