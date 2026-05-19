export type ExerciseDomain =
  | 'vocabulary'
  | 'grammar'
  | 'pronunciation'
  | 'listening'
  | 'reading'

export type ExerciseMode =
  | 'fill_blank'
  | 'multiple_choice'
  | 'reorder'
  | 'match_pairs'
  | 'dictation'
  | 'speak'
  | 'word_card'

export type ExerciseVariant =
  | 'sentence'
  | 'phoneme'
  | 'minimal_pair'
  | 'pick_sound'
  | 'pick_word'

export interface ExerciseType {
  domain: ExerciseDomain
  mode: ExerciseMode
  variant?: ExerciseVariant
}
