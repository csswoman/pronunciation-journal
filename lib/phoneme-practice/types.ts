export type ExerciseType = 'pick_word' | 'pick_sound' | 'minimal_pair' | 'dictation'

export type SoundStatus = 'locked' | 'available' | 'practicing' | 'mastered'

export interface Sound {
  id: number
  ipa: string
  example: string | null
  category: string | null
  type: string | null
  difficulty: number | null
}

export interface SoundWord {
  id: number
  sound_id: number
  word: string
  ipa: string | null
  audio_url: string | null
  difficulty: number | null
  phonemes: unknown | null
  sound_focus: string | null
}

export interface MinimalPair {
  id: number
  word_a: string
  word_b: string
  ipa_a: string | null
  ipa_b: string | null
  sound_group: string | null
  contrast_ipa_a: string | null
  contrast_ipa_b: string | null
  contrast_sound_a_id: number | null
  contrast_sound_b_id: number | null
}

export interface Option {
  id: string
  label: string
  isCorrect: boolean
}

export interface Exercise {
  type: ExerciseType
  soundId: number
  ipa: string
  targetWord?: string
  options: Option[]
  correctIds: string[]
}

export interface UserSoundProgress {
  id: string
  user_id: string
  sound_id: number
  status: SoundStatus
  total_attempts: number
  correct_answers: number
  streak: number
  best_streak: number
  last_practiced: string | null
  next_review: string | null
  ease_factor: number
  interval_days: number
}

export interface UserSoundProgressWithSound extends UserSoundProgress {
  sounds: Sound
}

export interface SessionAnswer {
  soundId: number
  exerciseType: ExerciseType
  isCorrect: boolean
  userAnswer: string
  targetWord?: string
  timeMs: number
  exercisePayload?: Record<string, unknown> | null
}

export interface SRResult {
  ease_factor: number
  interval_days: number
  streak: number
  next_review: Date
}
